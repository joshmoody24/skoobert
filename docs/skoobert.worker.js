import { parse, interpret } from "./skoobert.bundle.js";

self.addEventListener("message", (event) => {
  const { code, id } = event.data;

  try {
    // Parse the code
    const ast = parse(code);

    // Interpret with output handler
    const outputs = [];
    interpret(ast, {
      onOutput: (value) => {
        // Format output based on type
        let text;
        switch (value.type) {
          case "number":
            text = String(value.value);
            break;
          case "string":
            text = value.value;
            break;
          case "boolean":
            text = String(value.value);
            break;
          case "function":
            text = "[Function]";
            break;
          default:
            text = JSON.stringify(value);
        }

        // Send output incrementally
        self.postMessage({
          id,
          type: "output",
          value: text,
        });

        outputs.push(text);
      },
    });

    // Send completion message
    self.postMessage({
      id,
      type: "complete",
      outputs,
    });
  } catch (error) {
    // Send error message
    let errorMessage;
    if (
      error.name === "ParseError" ||
      error.name === "LexError" ||
      error.name === "RuntimeError"
    ) {
      errorMessage = error.toString();
    } else {
      errorMessage = "Error: " + error.message;
    }

    self.postMessage({
      id,
      type: "error",
      error: errorMessage,
    });
  }
});