import argparse
import uuid
import pulsar
import json
import sys

def produce(topic: str, json_data: str, num: int = 1, request: bool = False):
    try:
        # Parse the JSON string to ensure it's valid
        data = json.loads(json_data)
        # Convert back to string to ensure formatting
        message = json.dumps(data, ensure_ascii=False)
    except json.JSONDecodeError:
        print('Invalid JSON data provided.')
        return

    def callback(res, message_id):
        if message_id:
            print(f"Message sent to topic '{topic}' ({message_id}):")
            print(json.dumps(data, indent=4, ensure_ascii=False))
        else:
            print(f"Failed to send to topic '{topic}': {res}")

    # Create a producer for the specified topic
    producer = client.create_producer(topic)
    properties = {}
    if request:
        properties['request_id'] = str(uuid.uuid4())
    for i in range(num):
        producer.send_async(message.encode('utf-8'), callback, properties=properties)
    producer.flush()

    producer.close()


def main():
    parser = argparse.ArgumentParser(description='Produce a JSON message to a Pulsar topic.')
    parser.add_argument('--pulsar-url', type=str, default='pulsar://localhost:6650')
    parser.add_argument('--topic', type=str, required=True, help='Pulsar topic to produce to')
    parser.add_argument('--json', type=str, required=True, help="JSON string to send, or '-' to read from stdin")
    parser.add_argument('--num', type=int, default=1, help="Number of messages to produce")
    parser.add_argument('--request', type=bool, default=False, help="As a request message")
    args = parser.parse_args()
    global client
    client = pulsar.Client(args.pulsar_url)

    # Support reading JSON from stdin if --json is '-'
    if args.json == '-':
        json_data = sys.stdin.read()
    else:
        json_data = args.json

    produce(args.topic, json_data, args.num, args.request)


if __name__ == '__main__':
    main()
