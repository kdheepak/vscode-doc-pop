import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

class DocumentationHoverProvider implements vscode.HoverProvider {
  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> {
    return new Promise((resolve) => {
      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range);
      const config = vscode.workspace.getConfiguration("docPop");
      const docsFilePath = config.get<string>("docsFilePath");

      if (!docsFilePath) {
        resolve(null);
      }

      try {
        const absoluteDocsFilePath = vscode.workspace.asRelativePath(docsFilePath, false);
        fs.promises
          .readFile(absoluteDocsFilePath, "utf8")
          .then((fileContent) => {
            const docs = JSON.parse(fileContent);

            if (docs[word]) {
              const contents = new vscode.MarkdownString(docs[word]);
              contents.isTrusted = true;
              resolve(new vscode.Hover(contents));
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            console.error("Error reading custom JSON documentation file:", error);
            resolve(null);
          });
      } catch (error) {
        console.error("Error processing custom JSON documentation file:", error);
        resolve(null);
      }
    });
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: "file", language: "your-target-language" },
      new DocumentationHoverProvider(),
    ),
  );
}

export function deactivate() {}
