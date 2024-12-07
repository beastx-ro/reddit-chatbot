# Getting started
In order to run this project you need to install [Ollama](https://ollama.com/) and download the model named `llama3.2:latest` using a `pull` command from the llama cli.

You will also need [Docker Desktop](https://www.docker.com/products/docker-desktop/) since the project is packaged as a docker compose file.

## Creating a Reddit script app
Head over to the [Reddit Developer Portal](https://www.reddit.com/prefs/apps) and create a new app.
For the type select this option:
```
script	Script for personal use. Will only have access to the developers accounts
```

Copy the app id and app secret to the `.env` file.

## Create the Reddit Marketing Account
Ideally you should start with a clean account so go over to Reddit and create a new account.

Make sure you use a password without special characters (for some reason if you do this the Reddit Auth API is crashing, so the tool won't work).

## Running locally
Copy the `.env.example` file to `.env` and fill in the blacks. It comes with defaults it can.

Run `docker compose up -d` to start the app and it's dependencies in docker containers.

Please note that every time you update the env file you need to run the `docker-compose` command again for the changes to be reflected.

## Switching LLM providers
This project comes with support for both an Ollama server running locally, or using the Open AI API directly (for example if your computer is not powerful enough to run a local LLM).

If you want to switch to Open AI API, swap out the chatbot class from [./src/main.ts](/src/main.ts).
Uncomment this part:
```typescript
const chatbot = new ChatGptChatbot({
  openAiApiKey: env.openAiApiKey,
});
```

And comment out this part:
```typescript
const model = "llama3.2:latest";
const chatbot = new OllamaChatbot({
  host: env.ollama.host,
  model,
});
console.log(`Ollama Chatbot initialized using model ${model}`);
```

Finally, put your API key in the `OPENAI_API_KEY` env var.

## Watching the results
The docker will also spin up a MySQL DB where the app keeps track of the posts it processed.
You can access it with the credentials from the `.env.example` file with your favourite MYSQL GUI tool.
Just make sure to point it to localhost and port `3308` (configurable in the docker compose file).

In order to track what the bot is doing, you can open the logs in the running docker container.
The script is console.logging whatever title it is processing and also the generated reply.

# Run open web UI
If you've installed the Ollama server and running the model locally, you can also install Open Web UI, which
is basically like ChatGPT only on top of your local LLM instance.

You can grab it from here: https://github.com/open-webui/open-webui

Run this command to start the Open Web UI locally:
```bash
docker run -d -p 5005:8080 -e WEBUI_AUTH=False -e OLLAMA_BASE_URL=http://host.docker.internal -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main
```

Then visit: http://localhost:5005/