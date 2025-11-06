import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";

/**
 * Collaboration.jsx
 * - True incremental Yjs updates:
 *   - Outgoing: send Yjs binary updates on ydoc.on("update")
 *   - Incoming: apply Y.applyUpdate, then reflect only the changes in Monaco
 * - Protocol (client <-> collaboration-service):
 *   - Client -> Server:
 *       { type: "JOIN_ROOM", roomId }
 *       { type: "YJS_UPDATE", payloadB64 }  // incremental updates
 *   - Server -> Client:
 *       { type: "YJS_SYNC", payloadB64 }    // initial snapshot (one-time on join)
 *       { type: "YJS_UPDATE", payloadB64 }  // subsequent incremental updates
 *
 * Assumes your Matching.jsx navigates here with:
 *   navigate(`/collab/${sessionId}`, { state: { wsUrl, wsAuthToken, roomId } })
 */

export default function Collaboration() {
  const { sessionId } = useParams();
  const { state } = useLocation(); // { wsUrl, wsAuthToken, roomId }
  const navigate = useNavigate();

  // --- Minimal UI state ---
  const [status, setStatus] = useState("connecting…");
  const [language, setLanguage] = useState("javascript"); // choose a default, could be a prop
  const [isReadonly, setIsReadonly] = useState(false);

  // --- Yjs doc + model ---
  const ydoc = useMemo(() => new Y.Doc(), []);
  const ytext = useMemo(() => ydoc.getText("code"), [ydoc]);

  // --- Refs for interop ---
  const wsRef = useRef(null);
  const editorRef = useRef(null);
  const modelRef = useRef(null);
  const suppressLocalRef = useRef(false); // prevent echo loops when applying remote edits
  const joinedRef = useRef(false);

  // Helper: base64 <-> Uint8Array
  const toB64 = (u8) => btoa(String.fromCharCode(...u8));
  const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  // ---- WebSocket lifecycle ----
  useEffect(() => {
    if (!state?.wsUrl || !state?.wsAuthToken || !state?.roomId) {
      setStatus("missing session details");
      return;
    }

    // Token via query parameter (server also supports Authorization header if you prefer)
    const url = new URL(state.wsUrl);
    url.searchParams.set("token", state.wsAuthToken);
    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      // Join the room
      ws.send(JSON.stringify({ type: "JOIN_ROOM", roomId: state.roomId }));
      joinedRef.current = true;
      // After JOIN, server should send a one-time YJS_SYNC (initial snapshot)
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (!msg?.type) return;
        if (msg.type === "YJS_UPDATE" && msg.payloadB64) {
          const update = fromB64(msg.payloadB64);
          Y.applyUpdate(ydoc, update);
        } else if (msg.type === "YJS_SYNC" && msg.payloadB64) {
          // Initial snapshot (single Yjs update that brings us up to date)
          const snapshot = fromB64(msg.payloadB64);
          Y.applyUpdate(ydoc, snapshot);
          setStatus("synced");
        } else if (msg.type === "ERROR" && msg.reason) {
          setStatus(`error: ${msg.reason}`);
          // optional: setIsReadonly(true);
        }
      } catch (e) {
        // Non-JSON messages are ignored
      }
    };

    ws.onerror = () => setStatus("error");
    ws.onclose = () => setStatus("disconnected");

    return () => {
      try {
        ws.close();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.wsUrl, state?.wsAuthToken, state?.roomId]);

  // ---- Outgoing Yjs updates: send incremental updates only ----
  useEffect(() => {
    const onUpdate = (update, origin) => {
      // Only send updates that originated from the local editor
      // (If origin === 'remote' you could set that; here we rely on suppressLocalRef)
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      // If we're applying a remote edit to Monaco, don't send it back
      if (suppressLocalRef.current) return;

      const b64 = toB64(update);
      wsRef.current.send(JSON.stringify({ type: "YJS_UPDATE", payloadB64: b64 }));
    };

    ydoc.on("update", onUpdate);
    return () => ydoc.off("update", onUpdate);
  }, [ydoc]);

  // ---- Incoming Yjs changes -> apply as minimal Monaco edits ----
  useEffect(() => {
    // ytext.observe gives a delta array we can map to Monaco edits
    const onYTextEvent = (event) => {
      if (!editorRef.current || !modelRef.current) return;
      const editor = editorRef.current;
      const model = modelRef.current;
      const delta = event.delta;
      if (!delta || !delta.length) return;

      // Build Monaco edits from Yjs delta
      // We convert retain/insert/delete ops into precise text edits.
      let index = 0;
      const edits = [];
      delta.forEach((op) => {
        if (op.retain) {
          index += op.retain;
        } else if (op.insert) {
          const pos = model.getPositionAt(index);
          edits.push({
            range: new window.monaco.Range(
              pos.lineNumber,
              pos.column,
              pos.lineNumber,
              pos.column
            ),
            text: String(op.insert),
            forceMoveMarkers: true,
          });
          index += String(op.insert).length;
        } else if (op.delete) {
          const start = model.getPositionAt(index);
          const end = model.getPositionAt(index + op.delete);
          edits.push({
            range: new window.monaco.Range(
              start.lineNumber,
              start.column,
              end.lineNumber,
              end.column
            ),
            text: "",
            forceMoveMarkers: true,
          });
          // no index advance on delete (we removed content at current index)
        }
      });

      if (edits.length > 0) {
        suppressLocalRef.current = true;
        editor.executeEdits("yjs-remote", edits);
        suppressLocalRef.current = false;
      }
    };

    ytext.observe(onYTextEvent);
    return () => ytext.unobserve(onYTextEvent);
  }, [ytext]);

  // ---- Monaco -> Yjs (incremental) ----
  const onEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    modelRef.current = editor.getModel();

    // Initialize model with current Y.Text (in case sync arrived before editor)
    const initial = ytext.toString();
    if (initial && modelRef.current.getValue() !== initial) {
      suppressLocalRef.current = true;
      modelRef.current.setValue(initial);
      suppressLocalRef.current = false;
    }

    editor.onDidChangeModelContent((e) => {
      if (suppressLocalRef.current) return;
      // Translate Monaco content changes → Y.Text ops using offsets
      // e.changes is an array; apply in increasing offset order to keep positions correct
      const changes = [...e.changes].sort((a, b) => a.rangeOffset - b.rangeOffset);
      Y.transact(ydoc, () => {
        // We track a running shift of offsets as prior changes in the same batch affect subsequent offsets.
        let shift = 0;
        for (const c of changes) {
          const offset = c.rangeOffset + shift;
          const delLen = c.rangeLength;
          const insText = c.text || "";

          if (delLen > 0) {
            ytext.delete(offset, delLen);
            shift -= delLen;
          }
          if (insText.length > 0) {
            ytext.insert(offset, insText);
            shift += insText.length;
          }
        }
      });
    });
  };

  const endSession = () => {
    try {
      wsRef.current?.close();
    } catch {}
    navigate("/");
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 8, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
        <strong>Session:</strong> {sessionId}
        <span>·</span>
        <span>{status}</span>
        <span style={{ flex: 1 }} />
        <label style={{ fontSize: 12 }}>
          Language:&nbsp;
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="typescript">TypeScript</option>
          </select>
        </label>
        <button className="btn" onClick={endSession}>End session</button>
      </div>

      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage={language}
          language={language}
          options={{ readOnly: isReadonly, minimap: { enabled: false } }}
          onMount={onEditorMount}
        />
      </div>
    </div>
  );
}
