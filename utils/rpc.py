import argparse
import asyncio
import json
import sys
import uuid
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.pulsar_rpc import PulsarRPCManager

async def main():
    parser = argparse.ArgumentParser(description='Request a JSON message to a Pulsar Topic and get a response')
    parser.add_argument('--pulsar-url', type=str, default='pulsar://localhost:6650')
    parser.add_argument('--response-topic', type=str, default='non-persistent://public/default/response-' + str(uuid.uuid4()))
    parser.add_argument('--topic', type=str, required=True, help='Pulsar topic to produce to')
    parser.add_argument('--json', type=str, required=True, help="JSON string to send, or '-' to read from stdin")
    args = parser.parse_args()

    # Support reading JSON from stdin if --json is '-'
    if args.json == '-':
        json_data = sys.stdin.read()
    else:
        json_data = args.json

    # Initialize the RPC manager
    rpc_manager = PulsarRPCManager(
        service_url=args.pulsar_url,
        response_topic=args.response_topic,
    )

    try:
        # Example 1: Simple request
        print("Sending simple request...")
        response = await rpc_manager.request(
            topic=args.topic,
            data=json.loads(json_data),
        )
        pretty_json = json.dumps(response, indent=4, ensure_ascii=False)
        print(f"Received response:\n{pretty_json}")

    except Exception as e:
        print(f"Error occurred: {str(e)}")
    finally:
        # Clean up
        await rpc_manager.close()


if __name__ == "__main__":
    try:
        # Run the main function in an asyncio event loop
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nService stopped")
