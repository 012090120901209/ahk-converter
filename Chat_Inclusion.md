# Guide: Create a Chat Participant for VS Code

## Prerequisites
- Visual Studio Code 1.90 or later
- GitHub Copilot extension enabled in VS Code
- Node.js 18+
- npm (bundled with Node.js)

## 1. Scaffold the Extension
Run the Yeoman generator to bootstrap a TypeScript extension skeleton:

```bash
npx --package yo --package generator-code -- yo code
```

Recommended choices when prompted:
- `New Extension (TypeScript)`
- Provide an identifier such as `chat-tutorial`
- Skip the description, keep Git initialisation, choose `npm`

Open the generated folder in VS Code. The key files you will edit are `extension.ts` (logic) and `package.json` (manifest).

## 2. Declare the Chat Participant
Update the `contributes` section of `package.json` to register your chat participant:

```json
"contributes": {
  "chatParticipants": [
    {
      "id": "chat-tutorial.code-tutor",
      "fullName": "Code Tutor",
      "name": "tutor",
      "description": "Learn a concept with guided practice",
      "isSticky": true
    }
  ]
}
```

- `id` must be unique across extensions and is referenced at runtime.
- `name` is the handle that users type, for example `@tutor`.
- `description` appears as placeholder text in chat inputs.
- `isSticky` keeps the participant selected after the first interaction.

## 3. Implement the Participant
Replace the default `activate` implementation in `src/extension.ts` with the following code:

```ts
import * as vscode from 'vscode';

const BASE_PROMPT = `You are a helpful code tutor. Guide the user through programming concepts with clear explanations and short practice tasks. Decline non-programming questions.`;

export function activate(context: vscode.ExtensionContext) {
  const participant = vscode.chat.createChatParticipant(
    'chat-tutorial.code-tutor',
    {
      async handleRequest(request, context, stream) {
        // Combine the base prompt with the latest user message.
        const prompt = `${BASE_PROMPT}\n\nUser question: ${request.prompt}`;

        // Send the prompt to the language model and stream the reply.
        const response = await vscode.lm.sendRequest({
          messages: [{ role: 'user', content: prompt }],
          model: vscode.lm.ChatModel.GPT4O,
          signal: request.signal
        });

        for await (const fragment of response.stream) {
          stream.markdown(fragment.value);
        }
      }
    }
  );

  context.subscriptions.push(participant);
}

export function deactivate() {}
```

Key points:
- Use `vscode.chat.createChatParticipant` with the manifest `id`.
- `handleRequest` receives each chat turn. Combine the user prompt with your system guidance.
- Send work to the language model through `vscode.lm.sendRequest` (requires the GitHub Copilot extension).
- Stream chunks back via `stream.markdown` for responsive updates.

## 4. Optional Enhancements
- **Add slash commands:** extend `chatParticipants[0].commands` in `package.json` and handle them inside `handleRequest`.
- **Tool integration:** call workspace APIs (for example `vscode.workspace.findFiles`) and include results in the streamed response.
- **Custom prompts:** tailor `BASE_PROMPT` per command or based on `context.history`.

## 5. Test in VS Code
1. Run `npm install`.
2. Start the extension host with `F5` (Run & Debug → `Run Extension`).
3. Open the Copilot chat view, type `@tutor`, and ask a question to validate behaviour.

## 6. Package and Publish
- Update metadata in `package.json` (`displayName`, `description`, `repository`).
- Run `vsce package` to produce a `.vsix`.
- Publish with `vsce publish` after reviewing the Microsoft AI tools and practices guidelines and the GitHub Copilot extensibility policy.

---
Use this checklist whenever you create additional participants: configure the manifest, guide the language model with a clear prompt, handle requests, and test in the Copilot chat view.
