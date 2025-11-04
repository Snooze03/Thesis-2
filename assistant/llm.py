import os
from dotenv import load_dotenv
from openai import OpenAI


def create_chat_session():
    """Create an interactive chat session with the fitness coach"""

    # Load environment variables
    load_dotenv()
    client = OpenAI(api_key=os.getenv("ASSISTANT_API_KEY"))

    # Load system prompt
    with open("instructions.txt", "r") as f:
        system_prompt = f.read().strip()

    # Initialize conversation history
    messages = [
        {
            "role": "system",
            "content": system_prompt,
        }
    ]

    print("🏋️  Welcome to PrimeDfit Coach! 🏋️")
    print("Your personal fitness assistant is here to help.")
    print("Type 'quit', 'exit', or 'bye' to end the session.\n")

    while True:
        try:
            # Get user input
            user_input = input("Message: ").strip()

            # Check for exit commands
            if user_input.lower() in ["quit", "exit", "bye", "q"]:
                print(
                    "\nThanks for chatting! Keep up the great work with your fitness journey!"
                )
                break

            # Skip empty inputs
            if not user_input:
                continue

            # Add user message to conversation history
            messages.append({"role": "user", "content": user_input})

            print("\nAssistant: ", end="", flush=True)

            # Get response
            response = client.chat.completions.create(
                model=os.getenv("ASSISTANT_MODEL"),
                max_tokens=500,
                messages=messages,
                stream=True,
            )

            # Collect the full response for conversation history
            full_response = ""
            for chunk in response:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    print(content, end="", flush=True)
                    full_response += content

            print("\n")

            # Add assistant response to conversation history
            messages.append({"role": "assistant", "content": full_response})

        except KeyboardInterrupt:
            print("\n\nSession interrupted. Thanks for chatting!")
            break
        except Exception as e:
            print(f"\n❌ An error occurred: {e}")
            print("Please try again or type 'quit' to exit.\n")


def main():
    """Main function to run the chat session"""
    create_chat_session()


if __name__ == "__main__":
    main()
