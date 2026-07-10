import type { ComponentType } from "react";
import ReactAce from "react-ace";

type AceEditorProps = Record<string, unknown>;

function resolveAceEditor(module: unknown): ComponentType<AceEditorProps> {
  if (typeof module === "function") {
    return module as ComponentType<AceEditorProps>;
  }

  if (module && typeof module === "object" && "default" in module) {
    const nested = (module as { default: unknown }).default;
    if (typeof nested === "function") {
      return nested as ComponentType<AceEditorProps>;
    }
    if (nested && typeof nested === "object" && "default" in nested) {
      const deep = (nested as { default: unknown }).default;
      if (typeof deep === "function") {
        return deep as ComponentType<AceEditorProps>;
      }
    }
  }

  throw new Error("Failed to resolve AceEditor from react-ace");
}

const AceEditor = resolveAceEditor(ReactAce);

export default AceEditor;
