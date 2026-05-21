import axios from "axios";
import { Socket } from "socket.io-client";
import { config } from "./config";

interface PencilPoints {
  prevX: number;
  prevY: number;
  currX: number;
  currY: number;
}

type BaseShape = {
  id: string;
  origin?: "mouse" | "keyboard";
};

type Shape =
  | (BaseShape & {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    })
  | (BaseShape & {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    })
  | (BaseShape & {
      type: "pencil";
      points: PencilPoints[] | string;
    })
  | (BaseShape & {
      type: "text";
      text: string;
      x: number;
      y: number;
      fontSize: number;
    })
  | (BaseShape & {
      type: "triangle";
      x: number;
      y: number;
      size: number;
    })
  | (BaseShape & {
      type: "line" | "arrow";
      x: number;
      y: number;
      endX: number;
      endY: number;
    });

type PlacementCursor = {
  x: number;
  y: number;
};

const COMMANDS = new Set(["circle", "square", "rectangle", "triangle", "line", "arrow"]);
const FONT_SIZE = 28;
const CURSOR_STEP = 34;
const LINE_HEIGHT = 42;
const KEYBOARD_COMMIT_DELAY_MS = 450;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
};

const toCanvasPoint = (canvas: HTMLCanvasElement, event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
};

const drawPlacementCursor = (ctx: CanvasRenderingContext2D, cursor: PlacementCursor) => {
  ctx.save();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cursor.x, cursor.y - 18);
  ctx.lineTo(cursor.x, cursor.y + 18);
  ctx.moveTo(cursor.x - 18, cursor.y);
  ctx.lineTo(cursor.x + 18, cursor.y);
  ctx.stroke();
  ctx.restore();
};

const drawScene = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  cursor?: PlacementCursor,
) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawAll(shapes, ctx);

  if (cursor) {
    drawPlacementCursor(ctx, cursor);
  }
};

const makeKeyboardShape = (commandOrText: string, cursor: PlacementCursor): Shape => {
  const value = commandOrText.trim();
  const id = createId();
  const size = 80;

  switch (value.toLowerCase()) {
    case "circle":
      return {
        id,
        origin: "keyboard",
        type: "circle",
        centerX: cursor.x + size / 2,
        centerY: cursor.y,
        radius: size / 2,
      };
    case "square":
      return {
        id,
        origin: "keyboard",
        type: "rect",
        x: cursor.x,
        y: cursor.y - size / 2,
        width: size,
        height: size,
      };
    case "rectangle":
      return {
        id,
        origin: "keyboard",
        type: "rect",
        x: cursor.x,
        y: cursor.y - size / 2,
        width: 120,
        height: 70,
      };
    case "triangle":
      return {
        id,
        origin: "keyboard",
        type: "triangle",
        x: cursor.x,
        y: cursor.y,
        size,
      };
    case "line":
      return {
        id,
        origin: "keyboard",
        type: "line",
        x: cursor.x,
        y: cursor.y,
        endX: cursor.x + 110,
        endY: cursor.y,
      };
    case "arrow":
      return {
        id,
        origin: "keyboard",
        type: "arrow",
        x: cursor.x,
        y: cursor.y,
        endX: cursor.x + 110,
        endY: cursor.y,
      };
    default:
      return {
        id,
        origin: "keyboard",
        type: "text",
        text: commandOrText,
        x: cursor.x,
        y: cursor.y,
        fontSize: FONT_SIZE,
      };
  }
};

const getAdvanceForShape = (shape: Shape, ctx: CanvasRenderingContext2D) => {
  if (shape.type === "text") {
    ctx.save();
    ctx.font = `${shape.fontSize}px sans-serif`;
    const width = ctx.measureText(shape.text).width;
    ctx.restore();
    return Math.max(width + 16, CURSOR_STEP);
  }

  if (shape.type === "rect") {
    return Math.abs(shape.width) + 24;
  }

  if (shape.type === "circle") {
    return shape.radius * 2 + 24;
  }

  if (shape.type === "triangle") {
    return shape.size + 24;
  }

  if (shape.type === "line" || shape.type === "arrow") {
    return Math.abs(shape.endX - shape.x) + 24;
  }

  return CURSOR_STEP;
};

export const drawShapes = async (
  canvas: HTMLCanvasElement,
  currShape: string,
  socket: Socket,
  roomId: string,
  token: string,
  keyboardDrawMode: boolean,
) => {
  const existingShapes: Shape[] = (await getExistingShapes(roomId, token)) || [];
  const insertedShapeIds: string[] = [];
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  resizeCanvas();

  const cursor: PlacementCursor = {
    x: 120,
    y: 140,
  };

  drawScene(canvas, ctx, existingShapes, keyboardDrawMode ? cursor : undefined);

  const addShape = (shape: Shape) => {
    existingShapes.push(shape);
    insertedShapeIds.push(shape.id);
    socket.emit("message", { message: JSON.stringify(shape), roomId });
    cursor.x += getAdvanceForShape(shape, ctx);
    drawScene(canvas, ctx, existingShapes, keyboardDrawMode ? cursor : undefined);
  };

  const deleteShapeById = (shapeId: string) => {
    const index = existingShapes.findIndex((shape) => shape.id === shapeId);
    if (index !== -1) {
      existingShapes.splice(index, 1);
    }

    drawScene(canvas, ctx, existingShapes, keyboardDrawMode ? cursor : undefined);
  };

  const deleteLastInsertedShape = () => {
    const shapeId = insertedShapeIds.pop();
    if (!shapeId) return;

    deleteShapeById(shapeId);
    socket.emit("delete_shape", { shapeId, roomId });
  };

  const handleMessages = (data: { message: string }) => {
    const parsedData = JSON.parse(data.message) as Shape;
    existingShapes.push(parsedData);
    drawScene(canvas, ctx, existingShapes, keyboardDrawMode ? cursor : undefined);
  };

  const handleDeleteShape = (data: { shapeId: string }) => {
    deleteShapeById(data.shapeId);
  };

  let pencilPoints: PencilPoints[] = [];
  let startX = 0;
  let startY = 0;
  let prevX = 0;
  let prevY = 0;
  let drawing = false;
  let keyboardBuffer = "";
  let keyboardCommitTimer: number | null = null;

  const clearKeyboardCommitTimer = () => {
    if (keyboardCommitTimer) {
      window.clearTimeout(keyboardCommitTimer);
      keyboardCommitTimer = null;
    }
  };

  const commitKeyboardBuffer = () => {
    clearKeyboardCommitTimer();

    if (!keyboardBuffer) return;

    const shape = makeKeyboardShape(keyboardBuffer, cursor);
    keyboardBuffer = "";
    addShape(shape);
  };

  const scheduleKeyboardCommit = () => {
    clearKeyboardCommitTimer();
    keyboardCommitTimer = window.setTimeout(commitKeyboardBuffer, KEYBOARD_COMMIT_DELAY_MS);
  };

  const handleKeyboardInput = (event: KeyboardEvent) => {
    if (!keyboardDrawMode || document.activeElement !== canvas || isTypingTarget(event.target)) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      commitKeyboardBuffer();
      cursor.x = 120;
      cursor.y += LINE_HEIGHT;
      drawScene(canvas, ctx, existingShapes, cursor);
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      if (keyboardBuffer) {
        keyboardBuffer = keyboardBuffer.slice(0, -1);
        if (keyboardBuffer) {
          scheduleKeyboardCommit();
        } else {
          clearKeyboardCommitTimer();
        }
      } else {
        deleteLastInsertedShape();
      }
      drawScene(canvas, ctx, existingShapes, cursor);
      return;
    }

    if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      commitKeyboardBuffer();

      if (event.key === "ArrowLeft") cursor.x = Math.max(20, cursor.x - CURSOR_STEP);
      if (event.key === "ArrowRight") cursor.x += CURSOR_STEP;
      if (event.key === "ArrowUp") cursor.y = Math.max(40, cursor.y - LINE_HEIGHT);
      if (event.key === "ArrowDown") cursor.y += LINE_HEIGHT;

      drawScene(canvas, ctx, existingShapes, cursor);
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      keyboardBuffer += event.key;

      if (COMMANDS.has(keyboardBuffer.toLowerCase())) {
        commitKeyboardBuffer();
      } else {
        scheduleKeyboardCommit();
      }
    }
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (!drawing) return;
    drawing = false;

    const point = toCanvasPoint(canvas, event);
    const width = point.x - startX;
    const height = point.y - startY;
    let shape: Shape;

    if (currShape === "rect") {
      shape = {
        id: createId(),
        origin: "mouse",
        type: "rect",
        x: startX,
        y: startY,
        width,
        height,
      };
    } else if (currShape === "circle") {
      const centerX = (point.x + startX) / 2;
      const centerY = (point.y + startY) / 2;
      const radius = Math.sqrt(Math.pow(point.x - startX, 2) + Math.pow(point.y - startY, 2)) / 2;

      shape = {
        id: createId(),
        origin: "mouse",
        type: "circle",
        centerX,
        centerY,
        radius,
      };
    } else {
      shape = {
        id: createId(),
        origin: "mouse",
        type: "pencil",
        points: JSON.stringify(pencilPoints),
      };

      pencilPoints = [];
    }

    existingShapes.push(shape);
    insertedShapeIds.push(shape.id);
    socket.emit("message", { message: JSON.stringify(shape), roomId });
    drawScene(canvas, ctx, existingShapes, keyboardDrawMode ? cursor : undefined);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!drawing) return;

    const point = toCanvasPoint(canvas, event);
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#000000";

    if (currShape === "rect") {
      drawScene(canvas, ctx, existingShapes, keyboardDrawMode ? cursor : undefined);
      ctx.beginPath();
      ctx.rect(startX, startY, point.x - startX, point.y - startY);
      ctx.stroke();
    } else if (currShape === "circle") {
      drawScene(canvas, ctx, existingShapes, keyboardDrawMode ? cursor : undefined);
      const centerX = (point.x + startX) / 2;
      const centerY = (point.y + startY) / 2;
      const radius = Math.sqrt(Math.pow(point.x - startX, 2) + Math.pow(point.y - startY, 2)) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      drawAll(existingShapes, ctx);
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      pencilPoints.push({
        prevX,
        prevY,
        currX: point.x,
        currY: point.y,
      });
      prevX = point.x;
      prevY = point.y;
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    canvas.focus();
    commitKeyboardBuffer();
    drawing = true;
    const point = toCanvasPoint(canvas, event);
    startX = point.x;
    startY = point.y;
    prevX = point.x;
    prevY = point.y;
    cursor.x = point.x;
    cursor.y = point.y;
    drawScene(canvas, ctx, existingShapes, keyboardDrawMode ? cursor : undefined);
  };

  const handleResize = () => {
    resizeCanvas();
    drawScene(canvas, ctx, existingShapes, keyboardDrawMode ? cursor : undefined);
  };

  socket.on("new_message", handleMessages);
  socket.on("delete_shape", handleDeleteShape);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("keydown", handleKeyboardInput);
  window.addEventListener("resize", handleResize);

  return () => {
    clearKeyboardCommitTimer();
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("keydown", handleKeyboardInput);
    window.removeEventListener("resize", handleResize);
    socket.off("new_message", handleMessages);
    socket.off("delete_shape", handleDeleteShape);
  };
};

export const drawAll = (existingShapes: Shape[], ctx: CanvasRenderingContext2D) => {
  existingShapes.forEach((shape: Shape) => {
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    if (shape.type === "rect") {
      ctx.beginPath();
      ctx.rect(shape.x, shape.y, shape.width, shape.height);
      ctx.stroke();
    } else if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shape.type === "pencil") {
      const parsedPoints =
        typeof shape.points === "string" ? (JSON.parse(shape.points) as PencilPoints[]) : shape.points;
      parsedPoints.forEach((point: PencilPoints) => {
        ctx.beginPath();
        ctx.moveTo(point.prevX, point.prevY);
        ctx.lineTo(point.currX, point.currY);
        ctx.stroke();
      });
    } else if (shape.type === "text") {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = `${shape.fontSize}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(shape.text, shape.x, shape.y);
      ctx.restore();
    } else if (shape.type === "triangle") {
      ctx.beginPath();
      ctx.moveTo(shape.x + shape.size / 2, shape.y - shape.size / 2);
      ctx.lineTo(shape.x, shape.y + shape.size / 2);
      ctx.lineTo(shape.x + shape.size, shape.y + shape.size / 2);
      ctx.closePath();
      ctx.stroke();
    } else if (shape.type === "line" || shape.type === "arrow") {
      ctx.beginPath();
      ctx.moveTo(shape.x, shape.y);
      ctx.lineTo(shape.endX, shape.endY);
      ctx.stroke();

      if (shape.type === "arrow") {
        const angle = Math.atan2(shape.endY - shape.y, shape.endX - shape.x);
        const headLength = 16;
        ctx.beginPath();
        ctx.moveTo(shape.endX, shape.endY);
        ctx.lineTo(
          shape.endX - headLength * Math.cos(angle - Math.PI / 6),
          shape.endY - headLength * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(shape.endX, shape.endY);
        ctx.lineTo(
          shape.endX - headLength * Math.cos(angle + Math.PI / 6),
          shape.endY - headLength * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      }
    }
  });
};

const getExistingShapes = async (roomId: string, token: string) => {
  try {
    const res = await axios.get(`${config.backendUrl}/api/v1/rooms/data/shapes/${roomId}`, {
      headers: {
        Authorization: token,
      },
    });
    const shapes: Shape[] = [];
    const stringShapes = res.data.data.room.shapes;

    stringShapes.forEach((shape: { id: string; shapeData: string }) => {
      const objShape = JSON.parse(shape.shapeData) as Shape;
      shapes.push({
        ...objShape,
        id: objShape.id || shape.id,
      });
    });
    return shapes;
  } catch (error) {
    console.log(error);
  }
};
