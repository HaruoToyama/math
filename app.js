const svg = document.querySelector("#geometry-canvas");
const shapeLayer = document.querySelector("#shape-layer");
const labelLayer = document.querySelector("#label-layer");
const shapeSelect = document.querySelector("#shape-select");
const grid = document.querySelector("#grid");
const showLengths = document.querySelector("#show-lengths");
const showAngles = document.querySelector("#show-angles");

const initialShapes = {
  triangle: [{ x: 205, y: 365 }, { x: 550, y: 365 }, { x: 385, y: 110 }],
  quadrilateral: [{ x: 205, y: 355 }, { x: 540, y: 355 }, { x: 590, y: 175 }, { x: 250, y: 135 }],
};

let shape = "triangle";
let points = clone(initialShapes[shape]);
let comparison = null;
let draggingIndex = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function el(name, attributes = {}, text = "") {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  node.textContent = text;
  return node;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) / 50;
}

function angle(previous, current, next) {
  const a = { x: previous.x - current.x, y: previous.y - current.y };
  const b = { x: next.x - current.x, y: next.y - current.y };
  const radians = Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y)))));
  return radians * 180 / Math.PI;
}

function polygonArea(vertices) {
  return Math.abs(vertices.reduce((total, point, i) => {
    const next = vertices[(i + 1) % vertices.length];
    return total + point.x * next.y - next.x * point.y;
  }, 0)) / 2 / 2500;
}

function updateFacts() {
  const lengths = points.map((point, i) => distance(point, points[(i + 1) % points.length]));
  const angles = points.map((point, i) => angle(points[(i - 1 + points.length) % points.length], point, points[(i + 1) % points.length]));
  const perimeter = lengths.reduce((sum, value) => sum + value, 0);
  const sum = angles.reduce((total, value) => total + value, 0);
  const isTriangle = points.length === 3;

  document.querySelector("#perimeter").textContent = `${perimeter.toFixed(1)} cm`;
  document.querySelector("#area").textContent = `${polygonArea(points).toFixed(1)} cm²`;
  document.querySelector("#angle-sum").textContent = `${Math.round(sum)}°`;
  document.querySelector("#angle-sum-label").textContent = "内角の和";
  document.querySelector("#mission").textContent = isTriangle
    ? "三角形の内角の和を確かめよう"
    : "四角形の内角の和を確かめよう";
  document.querySelector("#canvas-title").textContent = isTriangle ? "三角形をつくろう" : "四角形をつくろう";
  document.querySelector("#discovery").innerHTML = isTriangle
    ? `どんな形に動かしても、3つの角を足すと <strong>180°</strong> になります。`
    : `どんな形に動かしても、4つの角を足すと <strong>360°</strong> になります。`;
  return { lengths, angles };
}

function addText(x, y, value, className) {
  labelLayer.append(el("text", { x, y, class: className, "text-anchor": "middle" }, value));
}

function render() {
  shapeLayer.replaceChildren();
  labelLayer.replaceChildren();
  const coordinates = points.map(({ x, y }) => `${x},${y}`).join(" ");

  if (comparison) {
    shapeLayer.append(el("polygon", {
      points: comparison.map(({ x, y }) => `${x},${y}`).join(" "),
      class: "comparison",
    }));
  }
  shapeLayer.append(el("polygon", { points: coordinates, class: "polygon" }));

  const { lengths, angles } = updateFacts();
  points.forEach((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const midpoint = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };
    if (showLengths.checked) addText(midpoint.x, midpoint.y - 10, `${lengths[index].toFixed(1)} cm`, "measurement");
    if (showAngles.checked) {
      const dx = ((previous.x - point.x) + (next.x - point.x)) / 14;
      const dy = ((previous.y - point.y) + (next.y - point.y)) / 14;
      addText(point.x + dx, point.y + dy + 5, `${Math.round(angles[index])}°`, "measurement");
    }
    addText(point.x, point.y - 17, String.fromCharCode(65 + index), "label");
    const vertex = el("circle", { cx: point.x, cy: point.y, r: 10, class: "vertex", tabindex: 0, "aria-label": `頂点 ${String.fromCharCode(65 + index)}` });
    vertex.addEventListener("pointerdown", (event) => {
      draggingIndex = index;
      vertex.setPointerCapture(event.pointerId);
      document.querySelector("#drag-status").textContent = `頂点 ${String.fromCharCode(65 + index)} を移動中`;
    });
    shapeLayer.append(vertex);
  });
}

function pointFromEvent(event) {
  const rect = svg.getBoundingClientRect();
  return {
    x: Math.max(20, Math.min(740, (event.clientX - rect.left) * 760 / rect.width)),
    y: Math.max(20, Math.min(480, (event.clientY - rect.top) * 500 / rect.height)),
  };
}

svg.addEventListener("pointermove", (event) => {
  if (draggingIndex === null) return;
  points[draggingIndex] = pointFromEvent(event);
  comparison = null;
  document.querySelector("#transform-message").textContent = "図形を動かしました。もう一度、変換して比べてみましょう。";
  render();
});

svg.addEventListener("pointerup", () => {
  if (draggingIndex !== null) document.querySelector("#drag-status").textContent = "頂点を動かせます";
  draggingIndex = null;
});

shapeSelect.addEventListener("change", () => {
  shape = shapeSelect.value;
  points = clone(initialShapes[shape]);
  comparison = null;
  render();
});

[showLengths, showAngles].forEach((input) => input.addEventListener("change", render));
document.querySelector("#show-grid").addEventListener("change", (event) => {
  grid.style.display = event.target.checked ? "block" : "none";
});
document.querySelector("#reset-button").addEventListener("click", () => {
  points = clone(initialShapes[shape]);
  comparison = null;
  document.querySelector("#transform-message").textContent = "図形を最初の形に戻しました。";
  render();
});
document.querySelector("#random-button").addEventListener("click", () => {
  points = points.map(() => ({ x: 100 + Math.random() * 560, y: 80 + Math.random() * 340 }));
  comparison = null;
  document.querySelector("#transform-message").textContent = "新しい図形ができました。内角の和は変わったかな？";
  render();
});

document.querySelectorAll("[data-transform]").forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.transform;
    if (type === "translate") {
      const minX = Math.min(...points.map(({ x }) => x));
      const maxX = Math.max(...points.map(({ x }) => x));
      const minY = Math.min(...points.map(({ y }) => y));
      const maxY = Math.max(...points.map(({ y }) => y));
      const dx = maxX + 115 <= 740 ? 115 : minX - 115 >= 20 ? -115 : 0;
      const dy = minY - 70 >= 20 ? -70 : maxY + 70 <= 480 ? 70 : 0;
      comparison = points.map(({ x, y }) => ({ x: x + dx, y: y + dy }));
    }
    if (type === "reflect") comparison = points.map(({ x, y }) => ({ x: 760 - x, y }));
    if (type === "rotate") comparison = points.map(({ x, y }) => ({ x: 760 - x, y: 500 - y }));
    const labels = { translate: "平行移動", reflect: "線対称移動", rotate: "180°回転" };
    document.querySelector("#transform-message").innerHTML = `点線は<strong>${labels[type]}</strong>した図形です。長さ・角度・面積が元の図形と同じか確かめよう。`;
    render();
  });
});
document.querySelector("#clear-transform").addEventListener("click", () => {
  comparison = null;
  document.querySelector("#transform-message").textContent = "変換ボタンを押すと、点線の図形が現れます。";
  render();
});

render();
