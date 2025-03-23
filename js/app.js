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
  // Calculate the maximum width for both canvases to fit side by side
  var maxWidth = window.innerWidth / 2; // Half the window width

  // Determine the scale factor to fit the SVG within the maxWidth
  var scaleFactor = Math.min(maxWidth / svgWidth, 1); // Ensure that we don't scale up the SVG (hence the '1')
  var canvasWidth = svgWidth * scaleFactor;
  var canvasHeight = svgHeight * scaleFactor;

  // Apply the dimensions to both canvases
  originalCanvas.width = canvasWidth;
  originalCanvas.height = canvasHeight;
  simplifiedCanvas.width = canvasWidth;
  simplifiedCanvas.height = canvasHeight;

  // Set the view size to the original SVG dimensions to prevent Paper.js from scaling it
  originalProject.view.viewSize = new paper.Size(svgWidth, svgHeight);
  simplifiedProject.view.viewSize = new paper.Size(svgWidth, svgHeight);

  // Scale the canvas CSS size to fit the screen
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

document.getElementById("cornerRadius").addEventListener("input", function () {
  if (originalSVG) {
    simplifyAndDraw(originalSVG.clone());
  }
});

function simplifyAndDraw(item) {
    var clonedItem = item.clone();

    // ⭐ Get the corner radius value from the slider
    var cornerRadius = parseFloat(document.getElementById("cornerRadius").value);

    // ⭐ ROUND FIRST if needed
    var roundedItem = clonedItem;
    if (cornerRadius > 0) {
        roundedItem = roundCorners(clonedItem, cornerRadius);
    }

    // ⭐ THEN SIMPLIFY the rounded version
    simplifySVG(roundedItem);

    drawSVG(item, roundedItem);
}

function simplifySVG(item) {
  var tolerance = parseFloat(toleranceInput.value);
  var mode = modeSelect.value;
  var factor = parseFloat(catmullFactorInput.value);

  if (item instanceof paper.Group) {
    item.children.forEach(function (child) {
      simplifySVG(child);
    });
  } else if (item instanceof paper.Path) {
    if (mode === "simplify" || mode === "both") {
      item.simplify(tolerance);
    }
    if (mode === "smooth" || mode === "both") {
      item.smooth({ type: 'catmull-rom', factor: factor });
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
  // Activate the simplified project
  simplifiedProject.activate();

  // Export the simplified SVG as a data URL
  var svgData = simplifiedProject.exportSVG({ asString: true });
  var blob = new Blob([svgData], {
    type: "image/svg+xml;charset=utf-8",
  });
  var url = URL.createObjectURL(blob);

  // Create a temporary anchor element and trigger a download
  var downloadLink = document.createElement("a");
  downloadLink.href = url;

  if (filename) {
    const seperator = filename.includes(" ")
      ? " "
      : filename.includes("_")
      ? "_"
      : "-";
    const name = filename.endsWith(".svg") ? filename.slice(0, -4) : filename;
    downloadLink.download = `${name}${seperator}smooth.svg`;
  } else {
    downloadLink.download = `smooth.svg`;
  }
  document.body.appendChild(downloadLink);
  downloadLink.click();

  // Clean up: remove the temporary link and revoke the object URL
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);

  if (window.sa_event) sa_event("svg_download");
});
function roundCorners(path, radius) {
    if (!path.segments.length) return path;

    var newPath = new paper.Path();
    newPath.strokeColor = path.strokeColor;
    newPath.closed = path.closed;

    var segments = path.segments;
    for (var i = 0; i < segments.length; i++) {
        var cur = segments[i].point;
        var prev = segments[(i - 1 + segments.length) % segments.length].point;
        var next = segments[(i + 1) % segments.length].point;

        var fromPrev = cur.subtract(prev).normalize(radius);
        var toNext = cur.subtract(next).normalize(radius);

        newPath.add({
            point: cur.subtract(fromPrev),
            handleOut: fromPrev.divide(2)
        });

        newPath.add({
            point: cur.subtract(toNext),
            handleIn: toNext.divide(2)
        });
    }

    newPath.simplify();
    return newPath;
}
