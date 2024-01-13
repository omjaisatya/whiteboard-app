import React, { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import "./App.css";

const Whiteboard = () => {
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const isDrawing = useRef(false);
  const lines = useRef([]);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [tool, setTool] = useState("pen");
  const [pages, setPages] = useState([{ history: [], index: -1 }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // Arrow feature start
  const [arrowStart, setArrowStart] = useState(null);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();

    if (tool === "arrow") {
      setArrowStart(pos);
    } else {
      lines.current.push({
        points: [pos.x, pos.y],
        color: tool === "eraser" ? "#ffffff" : color,
        brushSize,
      });
    }

    // for localStorage
    useEffect(() => {
      const savedHistory = JSON.parse(
        localStorage.getItem("whiteboardHistory")
      );
      if (savedHistory) {
        setHistory(savedHistory);
        setHistoryIndex(savedHistory.length - 1);
      }
    }, []);

    // save drawing history
    useEffect(() => {
      localStorage.setItem("whiteboardHistory", JSON.stringify(history));
    }, [history]);

    if (history.length > 0 && historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1));
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = stageRef.current;
    const point = stage.getPointerPosition();

    if (tool === "arrow") {
      setArrowStart((prevStart) => {
        const newArrow = {
          start: prevStart,
          end: { x: point.x, y: point.y },
          color,
          brushSize,
        };
        layerRef.current.children[0].destroy();
        layerRef.current.add(
          <Arrow
            key={lines.current.length}
            points={[prevStart.x, prevStart.y, point.x, point.y]}
            fill={color}
            stroke={color}
            strokeWidth={brushSize * 2}
          />
        );
        return newArrow.end;
      });
    } else {
      let lastLine = lines.current[lines.current.length - 1];
      lastLine.points = lastLine.points.concat([point.x, point.y]);

      layerRef.current.batchDraw();
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;

    if (tool !== "arrow" && lines.current.length > 0) {
      setPages((prevPages) => {
        const updatedPages = [...prevPages];
        const currentPage = updatedPages[currentPageIndex];
        currentPage.history = [...history, ...lines.current];
        currentPage.index = history.length;
        return updatedPages;
      });
    }
  };

  const handleColorChange = (e) => {
    setColor(e.target.value);
  };

  const handleBrushSizeChange = (e) => {
    setBrushSize(parseInt(e.target.value, 10));
  };

  const handleToolChange = (selectedTool) => {
    setTool(selectedTool);
    setArrowStart(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prevIndex) => prevIndex - 1);
      setLines(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prevIndex) => prevIndex + 1);
      setLines(history[historyIndex + 1]);
    }
  };

  const handleClear = () => {
    lines.current = [];
    setHistory([]);
    setHistoryIndex(-1);
    layerRef.current.clear();
    layerRef.current.batchDraw();
  };

  const handleSave = () => {
    const dataURL = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "drawing.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const stage = stageRef.current;
    stage.on("mousedown", handleMouseDown);
    stage.on("mousemove", handleMouseMove);
    stage.on("mouseup", handleMouseUp);

    return () => {
      stage.off("mousedown", handleMouseDown);
      stage.off("mousemove", handleMouseMove);
      stage.off("mouseup", handleMouseUp);
    };
  }, [color, brushSize, tool, history, historyIndex]);

  useEffect(() => {
    if (history.length > 0) {
      lines.current = history[historyIndex];
      layerRef.current.batchDraw();
    }
  }, [history, historyIndex]);

  return (
    <div className="border">
      <div className="bg-info bg-opacity-50 p-2 rounded border border-success">
        <label htmlFor="colorPicker">Color: </label>
        <input
          type="color"
          id="colorPicker"
          value={color}
          onChange={handleColorChange}
        />
        <label htmlFor="brushSize">Brush Size: </label>
        <input
          type="number"
          id="brushSize"
          value={brushSize}
          onChange={handleBrushSizeChange}
        />
        <button
          type="button"
          className="btn btn-success p-1 m-1 bi bi-pencil"
          onClick={() => handleToolChange("pen")}
        >
          Pen
        </button>
        <button
          type="button"
          className="btn btn-success p-1 m-1 bi bi-eraser"
          onClick={() => handleToolChange("eraser")}
        >
          Eraser
        </button>
        <button
          type="button"
          className="btn btn-success p-1 m-1 bi bi-arrow-counterclockwise"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
        >
          Undo
        </button>
        <button
          type="button"
          className="btn btn-success p-1 m-1 bi bi-arrow-clockwise"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
        >
          Redo
        </button>
        <button
          type="button"
          className="btn btn-success p-1 m-1 bi bi-x-circle"
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          type="button"
          className="btn btn-success p-1 m-1 bi bi-download"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
      <Stage
        className="border border-info border-2 rounded-2 bg-white"
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
      >
        <Layer ref={layerRef}>
          {lines.current.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.brushSize}
            />
          ))}
        </Layer>
      </Stage>
      <MyName />
    </div>
  );
};

const MyName = () => {
  return (
    <div className="d-flex">
      <h5 className="text-black">Created by:{"Satya Prakash"}</h5>
    </div>
  );
};

export default Whiteboard;
