import argparse
import pulsar
from datetime import datetime
import json

def read(topic: str, seek_time: datetime, num: int = 10):
    reader = client.create_reader(topic=topic, start_message_id=pulsar.MessageId.earliest, start_message_id_inclusive=True)
    reader.seek(int(seek_time.timestamp() * 1000))
    recv_num = 0
    while recv_num < num:
        try:
            msg = reader.read_next(timeout_millis=1000)
            if msg:
                raw_data = msg.data().decode('utf-8')
                try:
                    data = json.loads(raw_data)
                    pretty_json = json.dumps(data, indent=4, ensure_ascii=False)
                    print("---")
                    print(f"Read Index: {recv_num}")
                    print(f"Message ID: {msg.message_id()}")
                    print(f"Message Header: {msg.properties()}")
                    print(f"Publish time: {datetime.fromtimestamp(msg.publish_timestamp() / 1000).strftime('%Y-%m-%d %H:%M:%S')}")
                    print(pretty_json)
                except json.JSONDecodeError:
                    print("---")
                    print(raw_data)
                recv_num += 1
        except pulsar.Timeout:
            continue

def main():
    parser = argparse.ArgumentParser(description='Read messages from a Pulsar topic.')
    parser.add_argument('--pulsar-url', type=str, default='pulsar://localhost:6650')
    parser.add_argument('--topic', type=str, required=True, help='Pulsar topic to read from')
    parser.add_argument('--seek_time', type=str, required=False, default=datetime.now().strftime('%Y-%m-%d %H:%M:%S'), help='Seek time in format YYYY-MM-DD HH:MM:SS')
    parser.add_argument('--num', type=int, default=10, help='Number of messages to read')
    args = parser.parse_args()
    global client
    client = pulsar.Client(args.pulsar_url)

    try:
        seek_time = datetime.strptime(args.seek_time, '%Y-%m-%d %H:%M:%S')
    except ValueError:
        print('Invalid seek_time format. Use YYYY-MM-DD HH:MM:SS')
        return

    read(args.topic, seek_time, args.num)

if __name__ == '__main__':
    main()



