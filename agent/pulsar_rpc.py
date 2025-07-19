import json
import uuid
import asyncio
from typing import Dict, Any, Optional
import pulsar
from pulsar import Client, Producer, Consumer, Message
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

class PulsarRPCManager:
    """
    A manager class for handling RPC calls using Apache Pulsar as the message broker.
    This class provides functionality for making asynchronous RPC calls and handling responses.
    """

    def __init__(self, service_url: str, response_topic: str, auth_plugin: Optional[str] = None, auth_params: Optional[str] = None):
        """
        Initialize the PulsarRPCManager.

        Args:
            service_url (str): The Pulsar service URL (e.g., 'pulsar://localhost:6650')
            response_topic (str): The topic where responses will be received
            auth_plugin (Optional[str]): The authentication plugin type (e.g., 'tls', 'token', 'oauth2')
            auth_params (Optional[str]): The authentication parameters (format depends on auth_plugin)
        """
        self.service_url = service_url
        self.response_topic = response_topic
        
        # Create authentication object if provided
        authentication = None
        if auth_plugin and auth_params and auth_plugin.strip() and auth_params.strip():
            try:
                authentication = pulsar.Authentication(auth_plugin.strip(), auth_params.strip())
                logger.info(f"Creating Pulsar client with authentication: {auth_plugin}")
            except Exception as e:
                logger.error(f"Failed to create authentication: {str(e)}")
                raise Exception(f"Authentication failed: {str(e)}")
        else:
            logger.info("Creating Pulsar client without authentication")
        
        # Create client with or without authentication
        self.client = Client(service_url, authentication=authentication)
        
        # Dictionary to store pending requests, keyed by request_id
        self._pending_requests: Dict[str, asyncio.Future] = {}
        
        # Lock for thread-safe operations on pending_requests
        self._lock = asyncio.Lock()
        
        # Task for processing responses
        self._response_task = asyncio.create_task(self._process_responses())
        
        # Initialize consumer
        self.consumer = self.client.subscribe(
            self.response_topic,
            'rpc-response-subscription',
            consumer_type=pulsar.ConsumerType.Shared
        )

    @lru_cache(maxsize=100)
    def _get_producer(self, topic: str) -> Producer:
        """
        Get a producer for the specified topic. Uses LRU cache to avoid creating new producers.

        Args:
            topic (str): The topic to create a producer for

        Returns:
            Producer: A Pulsar producer for the specified topic
        """
        logger.info(f"Creating new producer for topic: {topic}")
        return self.client.create_producer(topic)

    async def _process_responses(self):
        """
        Process incoming response messages and complete the corresponding futures.
        This method runs in a loop to continuously process responses.
        """
        logger.info("Starting response processing loop...")
        while True:
            try:
                msg = await asyncio.get_event_loop().run_in_executor(
                    None, self.consumer.receive
                )
                logger.info("Received message")
                
                request_id = msg.properties().get('request_id')
                if not request_id:
                    logger.warning("Received response without request_id")
                    continue

                try:
                    response_data = json.loads(msg.data().decode('utf-8'))
                    async with self._lock:
                        if request_id in self._pending_requests:
                            future = self._pending_requests.pop(request_id)
                            future.set_result(response_data)
                except json.JSONDecodeError:
                    logger.error("Failed to decode response JSON")
                except Exception as e:
                    logger.error(f"Error processing response: {str(e)}")
                    async with self._lock:
                        if request_id in self._pending_requests:
                            future = self._pending_requests.pop(request_id)
                            future.set_exception(e)

                self.consumer.acknowledge(msg)
            except Exception as e:
                logger.error(f"Error in response processing loop: {str(e)}")
                await asyncio.sleep(1)  # Prevent tight loop in case of errors

    async def produce(self, topic:str, data: Any):
        try:
            loop = asyncio.get_event_loop()
            # Get a cached producer for this topic
            producer = self._get_producer(topic)
            if not producer:
                raise Exception(f"Failed to create producer for topic: {topic}")

            # Prepare the message
            message_data = json.dumps(data).encode('utf-8')

            future = loop.create_future()
            def callback(res, msg_id):
                if res != pulsar.Result.Ok:
                    err = Exception(f"Error producing: {res}")
                    logger.error(str(err))
                    loop.call_soon_threadsafe(future.set_exception, err)
                else:
                    loop.call_soon_threadsafe(future.set_result, msg_id)

            # Send the message
            producer.send_async(
                message_data,
                callback,
            )
            await future
        except Exception as e:
            logger.error(f"Error in producing message: {str(e)}")
            raise

    async def request(self, topic: str, data: Any) -> Dict[str, Any]:
        """
        Make an RPC request to the specified topic.

        Args:
            topic (str): The topic to send the request to
            data (Any): The data to send (will be converted to JSON)

        Returns:
            Dict[str, Any]: The response data

        Raises:
            Exception: If the request fails or times out
        """
        # Generate a unique request ID
        request_id = str(uuid.uuid4())
        
        # Create a future for this request
        future = asyncio.Future()
        
        # Store the future in pending requests
        async with self._lock:
            self._pending_requests[request_id] = future

        try:
            # Get a cached producer for this topic
            producer = self._get_producer(topic)
            if not producer:
                raise Exception(f"Failed to create producer for topic: {topic}")
            
            # Prepare the message
            message_data = json.dumps(data).encode('utf-8')
            
            # Set message properties
            properties = {
                'request_id': request_id,
                'response_topic': self.response_topic
            }
            
            # Send the message
            producer.send(
                message_data,
                properties=properties
            )
            
            # Wait for the response
            response = await asyncio.wait_for(future, timeout=60)
            return response
            
        except asyncio.TimeoutError:
            async with self._lock:
                await self._pending_requests.pop(request_id, None)
            raise TimeoutError(f"Request timed out after 60 seconds")
        except Exception as e:
            async with self._lock:
                await self._pending_requests.pop(request_id, None)
            raise

    async def close(self):
        """
        Close the PulsarRPCManager and clean up resources.
        """
        # Cancel the response processing task if it exists
        if self._response_task is not None:
            self._response_task.cancel()
            try:
                await self._response_task
            except asyncio.CancelledError:
                pass
            self._response_task = None
        
        # Clear the producer cache
        self._get_producer.cache_clear()
        
        if hasattr(self, 'consumer'):
            self.consumer.close()
        if hasattr(self, 'client'):
            self.client.close() 