import asyncio
from typing import Dict, Any
from function_stream import FSFunction, FSContext
import datetime


def get_current_time(context: FSContext, data: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.datetime.now()
    return {
        'result': f'The current time is {now.strftime("%Y-%m-%d %H:%M:%S %Z%z")}.'
    }


async def main():
    # Initialize the FunctionStream function
    function = FSFunction(
        process_funcs={
            'getCurrentTime': get_current_time,
        },
    )

    try:
        print("Starting agent function service...")
        await function.start()
    except Exception as e:
        print(f"\nAn error occurred: {e}")
    finally:
        await function.close()


if __name__ == "__main__":
    try:
        # Run the main function in an asyncio event loop
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nService stopped")
