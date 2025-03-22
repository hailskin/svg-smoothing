var originalCanvas = document.getElementById("canvasOriginal");
var simplifiedCanvas = document.getElementById("canvasSimplified");

// Initialize Paper.js for the original canvas
paper.setup(originalCanvas);

var originalProject = paper.project;
var simplifiedProject = new paper.Project(simplifiedCanvas);

var fileInput = document.getElementById("file");
var toleranceInput = document.getElementById("tolerance");
var modeSelect = document.getElementById("mode");
var catmullFactorInput = document.getElementById("catmullFactor");
var downloadBtn = document.getElementById("downloadBtn");
var originalSVG;
var filename = null;

catmullFactorInput.addEventListener("input", function () {
  document.getElementById("radiusValue").textContent = catmullFactorInput.value;
});

fileInput.addEventListener("change", function (event) {
  var files = event.target.files;
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (file.type.match("svg")) {
      filename = file.name;
      originalProject.clear();
      simplifiedProject.clear();

      paper.project = originalProject;
      paper.project.importSVG(file, function (item) {
        originalSVG = item.clone();
        var bounds = item.bounds;
        setCanvasSize(bounds.width, bounds.height);
        paper.project = simplifiedProject;
        simplifyAndDraw(item);
        downloadBtn.style.display = "unset";

        if (window.sa_event) sa_event("svg_upload");
      });
    } else {
      if (window.sa_event)
        sa_event("wrong_file_type", {
          type: file.type,
        });
      alert("Please select an SVG file.");
    }
  }
});

function setCanvasSize(svgWidth, svgHeight) {
  var maxWidth = window.innerWidth / 2;
  var scaleFactor = Math.min(maxWidth / svgWidth, 1);
  var canvasWidth = svgWidth * scaleFactor;
  var canvasHeight = svgHeight * scaleFactor;

  originalCanvas.width = canvasWidth;
  originalCanvas.height = canvasHeight;
  simplifiedCanvas.width = canvasWidth;
  simplifiedCanvas.height = canvasHeight;

  originalProject.view.viewSize = new paper.Size(svgWidth, svgHeight);
  simplifiedProject.view.viewSize = new paper.Size(svgWidth, svgHeight);

  originalCanvas.style.width = canvasWidth + "px";
  originalCanvas.style.height = canvasHeight + "px";
  simplifiedCanvas.style.width = canvasWidth + "px";
  simplifiedCanvas.style.height = canvasHeight + "px";
}

toleranceInput.addEventListener("input", function () {
  if (originalSVG) {
    simplifyAndDraw(originalSVG.clone());
  }
});

function simplifyAndDraw(item) {
  var simplifiedItem = item.clone();
  simplifySVG(simplifiedItem);
  drawSVG(item, simplifiedItem);
}

function simplifySVG(item) {
  var tolerance = parseFloat(toleranceInput.value);
  var mode = modeSelect.value;
  var radius = parseFloat(catmullFactorInput.value);

  if (item instanceof paper.Group) {
    item.children.forEach(function (child) {
      simplifySVG(child);
    });
  } else if (item instanceof paper.Path) {
    if (mode === "simplify" || mode === "both") {
      item.simplify(tolerance);
    }

    var segments = item.segments;
    if (!segments || segments.length < 3) return;

    if (mode === "smooth" || mode === "both") {
      var newPath = new paper.Path({
        strokeColor: item.strokeColor || 'black',
        strokeWidth: item.strokeWidth || 1,
        closed: item.closed
      });

      for (var i = 0; i < segments.length; i++) {
        var prev = segments[(i - 1 + segments.length) % segments.length].point;
        var curr = segments[i].point;
        var next = segments[(i + 1) % segments.length].point;

        var v1 = curr.subtract(prev).normalize();
        var v2 = next.subtract(curr).normalize();
        var angle = Math.acos(v1.dot(v2));

        if (angle < Math.PI * 0.75) { // If sharp angle
          var offset = Math.min(radius, curr.getDistance(prev) / 2, curr.getDistance(next) / 2);
          var cornerStart = curr.subtract(v1.multiply(offset));
          var cornerEnd = curr.add(v2.multiply(offset));
          newPath.lineTo(cornerStart);
          newPath.quadraticCurveTo(curr, cornerEnd);
        } else {
          newPath.lineTo(curr);
        }
      }

      if (item.closed) newPath.closePath();
      item.replaceWith(newPath);
    }
  }
}

function drawSVG(originalItem, simplifiedItem) {
  originalProject.activate();
  originalProject.clear();
  originalItem.clone().addTo(originalProject);

  simplifiedProject.activate();
  simplifiedProject.clear();
  simplifiedItem.addTo(simplifiedProject);
}

downloadBtn.addEventListener("click", function () {
  simplifiedProject.activate();
  var svgData = simplifiedProject.exportSVG({ asString: true });
  var blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var downloadLink = document.createElement("a");
  downloadLink.href = url;

  if (filename) {
    const seperator = filename.includes(" ") ? " " : filename.includes("_") ? "_" : "-";
    const name = filename.endsWith(".svg") ? filename.slice(0, -4) : filename;
    downloadLink.download = `${name}${seperator}smooth.svg`;
  } else {
    downloadLink.download = `smooth.svg`;
  }

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);

  if (window.sa_event) sa_event("svg_download");
});
