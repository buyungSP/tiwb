ImageEditor = {
    containerSelector : '#image_editor_container',
    containerEl : $('#image_editor_container'),
    canvas : null,
    activeTool : null,
    activeSelection : null,
    active(a){
      console.log(a)
    },
    init(){
      this.canvas = this.initializeCanvas();
      this.configUndoRedoStack();
      this.initializePathDrawing();
      this.initializeLineDrawing();
    },
    selects(){
      kolomList.innerHTML = ''
      kolomButton.innerHTML = ''
      kolomEx.innerHTML = ''
      this.canvas.getObjects().forEach( function(element, index) {
        element.clone(b => {
          c = document
          d = c.createElement('div')
          d.className = 'listImg'
          d.style.backgroundImage = 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHUlEQVQ4jWNgYGAQIYAJglEDhoUBg9+FowbQ2gAARjwKARjtnN8AAAAASUVORK5CYII=")'
          d.id = index
          d.setAttribute('onclick',`setA(this)`)
          d.style.border = '1px solid'
          e = c.createElement('div')
          f = b.toDataURL({
            format: 'png',
            multiplier: 0.5
          });
          e.style.backgroundImage = `url('${f}')`
          d.appendChild(e)
          kolomButton.appendChild(d)
        })
      });
      this.canvas.discardActiveObject();
      this.canvas.isDrawingLineMode = false;
      this.canvas.isDrawingPathMode = false;
      this.canvas.isDrawingMode = false;
      this.canvas.isDrawingTextMode = false;
      this.canvas.defaultCursor = 'default';
      this.canvas.selection = true;
      this.canvas.renderAll();
      this.canvas.forEachObject(o => {
        o.selectable = true;
        o.evented = true;
      })
    },
    unselects(){
      this.canvas.isDrawingLineMode = false;
      this.canvas.isDrawingPathMode = false;
      this.canvas.isDrawingMode = false;
      this.canvas.isDrawingTextMode = false;
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
      this.activeSelection = null;
    },
    uploads(){
      const processFiles = (files) => {
        console.log(files)
        for (let file of files) {
          let reader = new FileReader()
          if (file.type === 'image/svg+xml') {
            reader.onload = (f) => {
              fabric.loadSVGFromString(f.target.result, (objects, options) => {
                let obj = fabric.util.groupSVGElements(objects, options)
                obj.set({
                  originY: 'center',
                  originX: 'center',
                })
                obj.scaleToWidth(window.innerWidth)
                this.canvas.add(obj)
                this.canvas.setActiveObject(obj)
                this.canvas.renderAll()
              })
            }
            reader.readAsText(file)
          }else{
            reader.onload = (f) => {
              fabric.Image.fromURL(f.target.result, (img) => {
                img.set({
                  originY: 'center',
                  originX: 'center',
                  left: this.canvas.width/2,
                  top: this.canvas.height/2
                })
                img.scaleToWidth(window.innerWidth)
                this.canvas.add(img)
                this.canvas.setActiveObject(img)
                this.canvas.renderAll()
              })
            }
            reader.readAsDataURL(file) 
          }
        }
      }
      btn_image_upload.onchange = e => processFiles(e.target.files)
      $(`#btn_image_upload`).click();
    },
    downloads(){
      _self = this
      a = document
      b = a.createElement('div')
      b.className = "custom-modal-container"
      c = a.createElement('div')
      c.className = "custom-modal-content"
      d = a.createElement('div')
      d.className = "button-download"
      d.id = "svg"
      d.innerHTML = "Download as SVG"
      e = a.createElement('div')
      e.className = "button-download"
      e.id = "png"
      e.innerHTML = "Download as PNG"
      f = a.createElement('div')
      f.className = "button-download"
      f.id = "jpg"
      f.innerHTML = "Download as JPG"
      a.body.appendChild(b)
      b.appendChild(c)
      c.appendChild(d)
      c.appendChild(e)
      c.appendChild(f)

      a.querySelector(".custom-modal-container").onclick = function () {
        this.remove();
      }

      a.querySelector(".button-download").onclick = function (e) {
        let type = this.id
        if (type === 'svg') downloadSVG(_self.canvas.toSVG());
        else if (type === 'png') {
          downloadImage(_self.canvas.toDataURL())
        }
        else if (type === 'jpg') downloadImage(_self.canvas.toDataURL({
          format: 'jpeg'
        }), 'jpg', 'image/jpeg');
      }
    },
    saves(){
      if (window.confirm('The current canvas will be saved in your local! Are you sure?')) {
        saveInBrowser.save('canvasEditor', _self.canvas.toJSON());
      }
    },
    clears(){
      if (window.confirm('This will clear the canvas! Are you sure?')) {
        this.canvas.clear()
      }
    },
    styleBorder(a){
      let style = JSON.parse(a.value)
      this.canvas.getActiveObjects().forEach(obj => obj.set({
        strokeUniform: true,
        strokeDashArray: style.strokeDashArray,
        strokeLineCap: style.strokeLineCap
      }))
      this.canvas.renderAll()
    },
    styleCorner(a){
      this.canvas.getActiveObjects().forEach(obj => obj.set('strokeLineJoin', a.value))
      this.canvas.renderAll()
    },
    updateColors(a){
      if(!this.canvas.freeDrawingBrush){
        this.color = a.value
      }else{
        this.canvas.freeDrawingBrush.color = a.value
        this.canvas.getActiveObjects()[0].set('fill', a.value)
        this.canvas.renderAll()  
      }
    },
    updateDots(a){
      if(!this.canvas.freeDrawingBrush){
        this.dots = a.value
      }else{
        this.canvas.freeDrawingBrush.width = a.value
        this.canvas.getActiveObjects().forEach(obj => obj.set({
          strokeUniform: true,
          strokeWidth: a.value
        }))
        this.canvas.renderAll()
      }
    },
    gradientColors(){
      document.querySelector('#gradient_panel').style.display = 'block'
    },
    hapus(){
      this.unselects()
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush = new fabric.EraserBrush(this.canvas)
      this.canvas.freeDrawingBrush.width = parseInt(drawsizes.value)
      this.canvas.on('mouse:up', () => {
        this.history.push(JSON.stringify(this.canvas))
      });
    },
    pensils(){
      this.unselects()
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas)
      this.canvas.freeDrawingBrush.width = !drawsizes? 1 : parseInt(drawsizes.value)
      this.canvas.freeDrawingBrush.color = drawcolorings.value
      this.canvas.on('mouse:up', () => {
        this.history.push(JSON.stringify(this.canvas))
      });
    },
    sprays(){
      this.unselects()
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush = new fabric.SprayBrush(this.canvas)
      this.canvas.freeDrawingBrush.width = parseInt(drawsizes.value)
      this.canvas.freeDrawingBrush.color = drawcolorings.value
      this.canvas.on('mouse:up', () => {
        this.history.push(JSON.stringify(this.canvas))
      });
    },
    circles(){
      this.unselects()
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush = new fabric.CircleBrush(this.canvas)
      this.canvas.freeDrawingBrush.width = parseInt(drawsizes.value)
      this.canvas.freeDrawingBrush.color = drawcolorings.value
      this.canvas.on('mouse:up', () => {
        this.history.push(JSON.stringify(this.canvas))
      });
    },
    lines(){
      this.unselects()
      this.canvas.isDrawingLineMode = true;
      this.canvas.defaultCursor = 'crosshair'
      this.canvas.selection = false
      this.canvas.forEachObject(o => {
        o.selectable = false
        o.evented = false
      });
    },
    paths(){
      this.unselects()
      this.canvas.isDrawingPathMode = true
      this.canvas.defaultCursor = 'crosshair'
      this.canvas.selection = false
      this.canvas.forEachObject(o => {
        o.selectable = false
        o.evented = false
      });
    },
    texts(){
      this.unselects()
      this.canvas.isDrawingTextMode = true
      this.canvas.defaultCursor = 'crosshair'
      this.canvas.selection = false
      this.canvas.forEachObject(o => {
        o.selectable = false
        o.evented = false
      });
      this.canvas.isDrawingMode = true;
      let textbox = new fabric.Textbox('Your text goes here...', {
        top:this.canvas.height/2,
        left: this.canvas.width/2,
        width: this.canvas.width/2,
        fontSize: 18,
        fontFamily: "'Open Sans', sans-serif",
        originY: 'center',
        originX: 'center',
      });
      this.canvas.add(textbox)
      this.canvas.setActiveObject(textbox)
      this.canvas.renderAll()
      this.history.push(JSON.stringify(this.canvas))
    },
    backgrounds(){
      this.unselects()
      document.querySelector('#background_panel').style.display = 'block'
    },
    backgroundCanvass(a){
      this.canvas.backgroundColor = a.value
      this.canvas.renderAll();
    },
    getCanvasJSON(){return this.canvas.toJSON()},
    setCanvasJSON(current){
      current && this.canvas.loadFromJSON(JSON.parse(current), this.canvas.renderAll.bind(this.canvas))
    },
    setActiveTool(id){
      let width = 10;
      let color = 'black';
      this.activeTool = id;
      this.canvas.isDrawingLineMode = false;
      this.canvas.isDrawingPathMode = false;
      this.canvas.isDrawingMode = false;
      this.canvas.isDrawingTextMode = false;
      this.canvas.defaultCursor = 'default';
      this.canvas.selection = true;
      this.canvas.forEachObject(o => {
        o.selectable = true;
        o.evented = true;
      })
    },
    undo(){
      let undoList = this.history.getValues().undo;
      if (undoList.length) {
        let current = undoList[undoList.length - 1];
        this.history.undo();
        current && this.canvas.loadFromJSON(JSON.parse(current), this.canvas.renderAll.bind(this.canvas))
      }
    },
    redo(){
      let redoList = this.history.getValues().redo;
      if (redoList.length) {
        let current = redoList[redoList.length - 1];
        this.history.redo();
        current && this.canvas.loadFromJSON(JSON.parse(current), this.canvas.renderAll.bind(this.canvas))
      }
    },
    setActiveSelection(activeSelection){
      this.activeSelection = activeSelection;
      this.setActiveTool('select');
    },
    configUndoRedoStack() {
      this.history = window.UndoRedoStack();
    },
    textInputs(a){
      b = a.innerHTML.replace(/(?:\r\n|\r|\n|<br>)/g, '\n')
      this.canvas.getActiveObject().set({text:b}).setCoords()
      this.canvas.renderAll();
    },
    applyFilter(index, filter) {
      var obj = this.canvas.getActiveObject();
      if(!obj.filters[index]){
        obj.filters[index] = filter;
      }else{
        obj.filters[index] = ''
      }
      obj.applyFilters();
      this.canvas.renderAll();
    },
    resetfilter(){
      var obj = this.canvas.getActiveObject();
      for(i = 0; i < 13 ;i++){
        obj.filters[i] = ''
      }
      obj.applyFilters();
      this.canvas.renderAll();

    },
    getFilter(index) {
      var obj = this.canvas.getActiveObject();
      return obj.filters[index];
    },
    applyFilterValue(index, prop, value) {
      var obj = this.canvas.getActiveObject();
      if (obj.filters[index]) {
        obj.filters[index][prop] = value;
        obj.applyFilters();
        this.canvas.renderAll();
      }
    },
    initializeCanvas() {
      const fabricCanvas = new fabric.Canvas('c').setDimensions({
        width: 512,
        height: 512,
      })
      fabricCanvas.originalW = 512
      fabricCanvas.originalH = 512
      fabric.Object.prototype.transparentCorners = false;
      fabric.Object.prototype.cornerStyle = 'circle';
      fabric.Object.prototype.borderColor = '#C00000';
      fabric.Object.prototype.cornerColor = '#C00000';
      fabric.Object.prototype.cornerStrokeColor = '#FFF';
      fabric.Object.prototype.padding = 0;
      fabricCanvas.on('selection:created', (e) => {
        this.setActiveSelection(e.target.type)
        if(e.target.type == 'text'||e.target.type == 'textbox'){
          menuEditor('textEditor')
        }else if(e.target.type == 'polygon'||e.target.type == 'path'||e.target.type == 'circle'){
          menuEditor('shapeEditor')
        }else if(e.target.type == 'image'){
          menuEditor('pngEditor')
        }
      })
      fabricCanvas.on('selection:updated', (e) => {
        this.setActiveSelection(e.target.type)
        if(e.target.type == 'text'||e.target.type == 'textbox'){
          menuEditor('textEditor')
        }else if(e.target.type == 'polygon'||e.target.type == 'path'||e.target.type == 'circle'){
          menuEditor('shapeEditor')
        }else if(e.target.type == 'image'){
          menuEditor('pngEditor')
        }
      })
      fabricCanvas.on('selection:cleared', (e) => {
        let currentState = this.canvas.toJSON();
        this.history.push(JSON.stringify(currentState));
        this.setActiveSelection(null)
      })
      fabricCanvas.on('before:selection:cleared', function(e) {
      })
      fabricCanvas.on('object:rotating', (e) => {
        this.setActiveSelection(e.target.type)
        if (e.e.shiftKey) {
          e.target.snapAngle = 15;
        } else {
          e.target.snapAngle = false;
        }
      })
      fabricCanvas.on('object:modified', () => {
        for(a of this.canvas.getObjects()){
          if(a.id == 'top'){
            this.canvas.remove(a)
          }else if(a.id == 'left'){
            this.canvas.remove(a)
          }
        }
        let currentState = this.canvas.toJSON();
        this.history.push(JSON.stringify(currentState));
      })
      var line9 = new fabric.Line([
          fabricCanvas.width / 2, 0,
          fabricCanvas.width / 2, fabricCanvas.width
      ], {
          strokeDashArray: [5, 5],
          stroke: 'red',
          id:'left',
          selectable : false,
          evented : false,
          selected:false,
          lockMovementY: true,
          lockMovementX: true,
          lockUniScaling: true
      })
      var line10 = new fabric.Line([
          0, fabricCanvas.height / 2,
          fabricCanvas.width, fabricCanvas.height / 2
      ], {
          strokeDashArray: [5, 5],
          stroke: 'red',
          strokeWidth: 1,
          id:'top',
          selectable : false,
          evented : false,
          selected:false,
          lockMovementY: true,
          lockMovementX: true,
          lockUniScaling: true
      })
      var snapZone = 5;
      fabricCanvas.on('object:moving', function(options) {
        if(options.target.left > fabricCanvas.width / 2 - snapZone && options.target.left < fabricCanvas.width / 2 + snapZone) {
          options.target.set({
            left: fabricCanvas.width / 2
          }).setCoords();
          b = 0
          for(a of fabricCanvas.getObjects()){
            if(a.id == 'left'){
              b += 1
            }
          }
          if(!b){
            fabricCanvas.add(line9);
          }
          document.addEventListener("mouseup", () => fabricCanvas.remove(line9));
        }else{
          fabricCanvas.remove(line9);
        }
        if(options.target.top > fabricCanvas.height / 2 - snapZone && options.target.top < fabricCanvas.height / 2 + snapZone) {
          options.target.set({
            top: fabricCanvas.height / 2
          }).setCoords();
          b = 0
          for(a of fabricCanvas.getObjects()){
            if(a.id == 'top'){
              b += 1
            }
          }
          if(!b){
            fabricCanvas.add(line10);
          }
          document.addEventListener("mouseup", () => fabricCanvas.remove(line10));
        }else{
          fabricCanvas.remove(line10);
        }
      });
      const savedCanvas = saveInBrowser.load('canvasEditor');
      if (savedCanvas) {
        fabricCanvas.loadFromJSON(savedCanvas, fabricCanvas.renderAll.bind(fabricCanvas));
      }
      setTimeout(() => {
        for(a of fabricCanvas.getObjects()){
          if(a.id == 'top'){
            fabricCanvas.remove(a)
          }else if(a.id == 'left'){
            fabricCanvas.remove(a)
          }
        }
        let currentState = fabricCanvas.toJSON();
        this.history.push(JSON.stringify(currentState));
      }, 1000);
      return fabricCanvas;
    },
    initializeShapes(a) {
      _self = this
      fabric.loadSVGFromString(
        a.innerHTML,
        (objects, options) => {
          var obj = fabric.util.groupSVGElements(objects, options)
          obj.strokeUniform = true
          obj.strokeLineJoin = 'miter'
          obj.set({
            top:_self.canvas.height/2,
            left:_self.canvas.width/2,
            originY: 'center',
            originX: 'center',
          })
          obj.scaleToWidth(100)
          obj.scaleToHeight(100)
          _self.canvas.add(obj)
          _self.canvas.setActiveObject(obj)
          _self.canvas.renderAll()
          _self.history.push(JSON.stringify(_self.canvas))
        }
      )
      kolomList.innerHTML = ''
    },



    initializeLineDrawing () {
      let isDrawingLine = false,lineToDraw, pointer, pointerPoints
      this.canvas.on('mouse:down', (o) => {
        if (!this.canvas.isDrawingLineMode) return
        isDrawingLine = true
        pointer = this.canvas.getPointer(o.e)
        pointerPoints = [pointer.x, pointer.y, pointer.x, pointer.y]
        lineToDraw = new fabric.Line(pointerPoints, {
          strokeWidth: parseInt(drawsizes.value),
          stroke: drawcolorings.value
        });
        lineToDraw.selectable = false
        lineToDraw.evented = false
        lineToDraw.strokeUniform = true
        this.canvas.add(lineToDraw)
      });
      this.canvas.on('mouse:move', (o) => {
        if (!isDrawingLine) return
        pointer = this.canvas.getPointer(o.e)
        if (o.e.shiftKey) {
          let startX = pointerPoints[0]
          let startY = pointerPoints[1]
          let x2 = pointer.x - startX
          let y2 = pointer.y - startY
          let r = Math.sqrt(x2 * x2 + y2 * y2)
          let angle = (Math.atan2(y2, x2) / Math.PI * 180)
          angle = parseInt(((angle + 7.5) % 360) / 15) * 15
          let cosx = r * Math.cos(angle * Math.PI / 180)
          let sinx = r * Math.sin(angle * Math.PI / 180)
          lineToDraw.set({
            x2: cosx + startX,
            y2: sinx + startY
          })
        } else {
          lineToDraw.set({
            x2: pointer.x,
            y2: pointer.y
          })
        }
        this.canvas.renderAll()
      });
      this.canvas.on('mouse:up', () => {
        if (!isDrawingLine) return
        lineToDraw.setCoords()
        isDrawingLine = false
        this.history.push(JSON.stringify(this.canvas))
      });
    },
    inRange : (radius, cursorX, cursorY, targetX, targetY) => {
      if (
        Math.abs(cursorX - targetX) <= radius &&
        Math.abs(cursorY - targetY) <= radius
      ) {
        return true
      }
      return false
    },
    initializePathDrawing (){
      let isDrawingPath = false,
        pathToDraw,
        pointer,
        updatedPath,
        isMouseDown = false,
        isDrawingCurve = false,
        rememberX, rememberY
      this.canvas.on('mouse:down', (o) => {
        if (!this.canvas.isDrawingPathMode) return
        isMouseDown = true
        isDrawingPath = true
        pointer = this.canvas.getPointer(o.e)
        if (!pathToDraw) {
          pathToDraw = new fabric.Path(`M${pointer.x} ${pointer.y} L${pointer.x} ${pointer.y}`, {
            strokeWidth: parseInt(drawsizes.value),
            stroke: drawcolorings.value,
            fill: false
          })
          pathToDraw.selectable = false
          pathToDraw.evented = false
          pathToDraw.strokeUniform = true
          this.canvas.add(pathToDraw)
          return
        }
        if (pathToDraw) {
          pathToDraw.path.push(['L', pointer.x, pointer.y])
          let dims = pathToDraw._calcDimensions()
          pathToDraw.set({
            width: dims.width,
            height: dims.height,
            left: dims.left,
            top: dims.top,
            pathOffset: {
              x: dims.width / 2 + dims.left,
              y: dims.height / 2 + dims.top
            },
            dirty: true
          })
          pathToDraw.setCoords()
          this.canvas.renderAll()
          return
        }
      });
      this.canvas.on('mouse:move', (o) => {
        if (!this.canvas.isDrawingPathMode) return
        if (!isDrawingPath) return
        pointer = this.canvas.getPointer(o.e)
        if (!isDrawingCurve) {
          updatedPath = ['L', pointer.x, pointer.y]
        }
        pathToDraw.path.pop()
        if (o.e.shiftKey && !isDrawingCurve) {
          let lastPoint = [...pathToDraw.path].pop()
          let startX = lastPoint[1]
          let startY = lastPoint[2]
          let x2 = pointer.x - startX
          let y2 = pointer.y - startY
          let r = Math.sqrt(x2 * x2 + y2 * y2)
          let angle = (Math.atan2(y2, x2) / Math.PI * 180)
          angle = parseInt(((angle + 7.5) % 360) / 15) * 15
          let cosx = r * Math.cos(angle * Math.PI / 180)
          let sinx = r * Math.sin(angle * Math.PI / 180)
          updatedPath[1] = cosx + startX
          updatedPath[2] = sinx + startY
        }
        if (pathToDraw.path.length > 1 && !isDrawingCurve) {
          let snapPoints = [...pathToDraw.path]
          snapPoints.pop()
          for (let p of snapPoints) {
            if ((p[0] === 'L' || p[0] === 'M') && this.inRange(10, pointer.x, pointer.y, p[1], p[2])) {
              updatedPath[1] = p[1]
              updatedPath[2] = p[2]
              break
            }
            if (p[0] === 'Q' && this.inRange(10, pointer.x, pointer.y, p[3], p[4])) {
              updatedPath[1] = p[3]
              updatedPath[2] = p[4]
              break
            }
          }
        }
        if (isMouseDown) {
          if (!isDrawingCurve && pathToDraw.path.length > 1) {
            isDrawingCurve = true
            let lastPath = pathToDraw.path.pop()
            if (lastPath[0] === 'Q') {
              updatedPath = ['Q', lastPath[3], lastPath[4], lastPath[3], lastPath[4]]
              rememberX = lastPath[3]
              rememberY = lastPath[4]
            } else {
              updatedPath = ['Q', lastPath[1], lastPath[2], lastPath[1], lastPath[2]]
              rememberX = lastPath[1]
              rememberY = lastPath[2]
            }
          } else if (isDrawingCurve) {
            let mouseMoveX = pointer.x - updatedPath[3]
            let mouseMoveY = pointer.y - updatedPath[4]
            updatedPath = [
              'Q',
              rememberX - mouseMoveX,
              rememberY - mouseMoveY,
              rememberX,
              rememberY
            ]
          }
        }
        pathToDraw.path.push(updatedPath)
        let dims = pathToDraw._calcDimensions();
        pathToDraw.set({
          width: dims.width,
          height: dims.height,
          left: dims.left,
          top: dims.top,
          pathOffset: {
            x: dims.width / 2 + dims.left,
            y: dims.height / 2 + dims.top
          },
          dirty: true
        })
        this.canvas.renderAll()
      })
      this.canvas.on('mouse:up', (o) => {
        if (!this.canvas.isDrawingPathMode) {
          isMouseDown = false
          isDrawingCurve = false
          return
        }
        isMouseDown = false
        if (isDrawingCurve) {
          pointer = this.canvas.getPointer(o.e)
          pathToDraw.path.push(['L', pointer.x, pointer.y])
          let dims = pathToDraw._calcDimensions()
          pathToDraw.set({
            width: dims.width,
            height: dims.height,
            left: dims.left,
            top: dims.top,
            pathOffset: {
              x: dims.width / 2 + dims.left,
              y: dims.height / 2 + dims.top
            },
            dirty: true
          })
          pathToDraw.setCoords()
          this.canvas.renderAll()
        }
        this.history.push(JSON.stringify(this.canvas))
        isDrawingCurve = false
      })
      const cancelDrawing = () => {
        pathToDraw.path.pop()
        if (pathToDraw.path.length > 1) {
          let dims = pathToDraw._calcDimensions();
          pathToDraw.set({
            width: dims.width,
            height: dims.height,
            left: dims.left,
            top: dims.top,
            pathOffset: {
              x: dims.width / 2 + dims.left,
              y: dims.height / 2 + dims.top
            },
            dirty: true
          })
        } else {
          this.canvas.remove(pathToDraw);
        }
        this.canvas.renderAll()
        pathToDraw = null
        isDrawingPath = false
      }
      document.addEventListener('keydown', (e) => {
        if (!isDrawingPath) return
        const key = e.which || e.keyCode;
        if (key === 27) cancelDrawing()
      })
      document.addEventListener('mousedown', (e) => {
        if (!isDrawingPath) return
        if (!document.querySelector('.canvas-container').contains(e.target)) {
          cancelDrawing()
        }
      })
    },
  }

