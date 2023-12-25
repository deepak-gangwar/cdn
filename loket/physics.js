function breadPhysics() {
  if(!document.querySelector('#about')) return

  // UTILITY TO LOAD AN IMAGE THROUGH JAVASCRIPT
  // ===========================================

  const loadImage = (url, onSuccess) => {
    const img = new Image()
    img.onload = () => onSuccess(img.src)
    // img.onerror = onError()
    img.src = url
  }


  // THROTTLING TO IMPROVE RESIZE HANDLER PERFORMANCE
  // ================================================
  
  function throttler({ delay = 200, update, onlyAtEnd = false }) {
    let elapsedTime = 0, 
      timer = 0;
    
    return () => {
      let firstTime = true, 
        currentTime = performance.now();
      
      if((elapsedTime && currentTime < elapsedTime + delay) || firstTime) {
        firstTime = false
        clearTimeout(timer)
        timer = setTimeout(() => {
          // do something when user has stopped resizing or scrolling
          elapsedTime = currentTime
          update()
        }, delay)
      } else {
        elapsedTime = currentTime
        if(!onlyAtEnd) {
          firstTime = false
          update()
        }
      }
    }
  }

  // MATTER.JS LOGIC
  // ===============

  const container = document.querySelector('#matter-container')
  let CW = container.clientWidth
  let CH = container.clientHeight
  const THICCNESS = 60

  // module aliases
  let Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite;

  // create an engine
  const engine = Engine.create()
  engine.gravity.scale = 0.0025

  // create a renderer
  const render = Render.create({
    element: container,
    engine: engine, 
    options: {
      width: CW,
      height: CH,
      background: "transparent",
      wireframes: false,
    }
  })

  // CREATE BOUNDS (WALLS, GROUND)
  // =============================

  const ground = Bodies.rectangle(CW / 2, CH + THICCNESS / 2 + 1, 27184, THICCNESS, { isStatic: true })
  const leftWall = createWall(0 - THICCNESS / 2 - 1)
  const rightWall = createWall(CW + THICCNESS / 2 + 1)

  function createWall(xPos) {
    return Bodies.rectangle(xPos, CH / 2, THICCNESS, CH * 15, { isStatic: true })
  }

  Composite.add(engine.world, [ground, leftWall, rightWall])


  // CREATE BODIES (ELLIPSES)
  // ========================

  const DOMBreadImg = document.querySelector('.main-bread')
  const original = DOMBreadImg.getBoundingClientRect()
  const originalWidth = original.width
  const originalLeft = original.left

  
  // Creating coordinates for ellipses
  function createEllipseVertices(size, flatness) {
    const num = 50
    let vertices = []

    for (let i = 0; i < num; i++) {
      let x = size * Math.cos(i)
      let y = flatness * size * Math.sin(i)
      vertices.push({ x: x, y: y })
    }

    return vertices
  }


  let ev1 = createEllipseVertices(originalWidth / 2, 1.4) // -> for the main bread "ALSO US"
  let ev2 = createEllipseVertices(originalWidth / 1.5, 0.75)
  let ev3 = createEllipseVertices(originalWidth / 1.5, 0.65)

  
  // MOUSE CONTROLS
  // ==============

  let mouse = Matter.Mouse.create(render.canvas)
  let mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: false
      }
    }
  })

  Composite.add(engine.world, mouseConstraint)

  // If we are hovering over the canvas, that blocks the scroll events
  // This is not good from user's point of view, so we do this to allow scroll through the canvas
  // But this shit only works on PC, not on mobile and adding touchevents caused other problems

  mouseConstraint.mouse.element.removeEventListener("mousewheel", mouseConstraint.mouse.mousewheel)
  mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel)


  // RENDERING
  // =========

  Render.run(render)
  const runner = Runner.create()
  Runner.run(runner, engine) // -> run the engine


  // LAUNCH SETUP
  // ============

  const title = document.querySelector('.bread-title')
  title.addEventListener('click', initMatter)

  function initMatter() {
    container.style.zIndex = 2  

    let canvasTop = -container.getBoundingClientRect().top
    let spawnY = canvasTop + DOMBreadImg.getBoundingClientRect().top + window.innerWidth * 0.11

    // CREATE BREAD BODIES FROM ELLIPSES
  
    const ellipse1 = Bodies.fromVertices(originalLeft + originalWidth / 2, spawnY, ev1, 5)
    const ellipse2 = Bodies.fromVertices(CW * 0.12, canvasTop - 100, ev2, 5)
    const ellipse3 = Bodies.fromVertices(CW * 0.86, canvasTop - 100, ev3, 5)

    // CREATE BREAD BODIES FROM RECTANGLES

    const borderRadius = CW / 16
    const borderRadius2 = CW / 14
    const slicedBread2 = Bodies.rectangle(CW * 0.25, canvasTop - 500, CW/7, CW/13, { chamfer: { radius: [borderRadius, borderRadius, 0, 0] } })
    const slicedBread1 = Bodies.rectangle(CW * 0.28, canvasTop - 300, CW/7, CW/13, { chamfer: { radius: [borderRadius2, borderRadius2, 0, 0] } })
    const rect1 = Bodies.rectangle(CW * 0.8, canvasTop - 300, CW/6, CW/8, { chamfer: { radius: [CW/16, CW/18, CW/20, CW/16] } })
    const rect2 = Bodies.rectangle(CW * 0.5, canvasTop - 300, CW/6.4, CW/8, { chamfer: { radius: [CW/16, CW/16, CW/18, CW/16] } })


    function degToRad(angle) {
      return angle * (Math.PI / 180)
    }

    ellipse1.restitution = 0.5
    ellipse2.restitution = 0.5
    ellipse3.restitution = 0.5
    rect1.restitution = 0.5
    rect2.restitution = 0.5
    slicedBread1.restitution = 0.5
    slicedBread2.restitution = 0.5
    Matter.Body.rotate(ellipse1, degToRad(38))
    Matter.Body.rotate(slicedBread1, degToRad(180))
    Matter.Body.scale(ellipse1, 0.85, 0.85)
    Matter.Body.scale(ellipse2, 0.85, 0.85)
    Matter.Body.scale(ellipse3, 0.9, 0.9)
    Matter.Body.translate(ellipse1, { x: 0.6 * CW/100, y: 0 })


    // SET BREAD IMAGE TEXTURES

    function addTextureToBody(src, el, xFactor, yFactor) {
      loadImage(src, url => {
          updateLoadedImgs()
          el.render.sprite.texture = url
          el.render.sprite.xScale = originalWidth / xFactor
          el.render.sprite.yScale = originalWidth / yFactor
          el === slicedBread1 && (el.render.sprite.yOffset = CW / originalWidth * 0.078)
          Composite.add(engine.world, el)
        }
      )
    }

    addTextureToBody("/images/main-bread.png", ellipse1, 329, 329)
    addTextureToBody("/images/bread/2.png", ellipse2, 1300, 1300)
    addTextureToBody("/images/bread/3.png", rect1, 1300, 1300)
    addTextureToBody("/images/bread/4.png", ellipse3, 1300, 1200)
    addTextureToBody("/images/bread/5.png", rect2, 1300, 1300)
    addTextureToBody("/images/bread/6.png", slicedBread1, 1300, 1300)
    addTextureToBody("/images/bread/7.png", slicedBread2, 1350, 1200)

    let imgsLoaded = 0
    function updateLoadedImgs() {
      imgsLoaded++
      if(imgsLoaded === 7) {
        setTimeout(() => {
          document.querySelector('.s0').style.zIndex = 3
          document.querySelectorAll('.accordion').forEach(section => {
            section.style.zIndex = 3
          })
        }, 2000)
      }
    }

    DOMBreadImg.style.opacity = 0

    // These listeners are inside because we need this functionality after the launch
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mouseup', handleMouseUp)
  }

  let clickedAgain = false

  function handleMouseDown() {
    clickedAgain = true
    container.style.zIndex = 4
  }

  function handleMouseUp() {
    clickedAgain = false
    setTimeout(() => {
      if(!clickedAgain) {
        clickedAgain = false
        container.style.zIndex = 2
      }
    }, 1500)
  }

  function handleResize() {
    CW = container.clientWidth
    CH = container.clientHeight

    // set canvas size to new values
    render.canvas.width = CW
    render.canvas.height = CH

    // reposition ground and wall (left stays at 0 so no effect of resizing)
    // Tutorial didn't know how to create the width of ground equal to viewport width so he is setting it to a ridiculously large value
    Matter.Body.setPosition(ground, Matter.Vector.create(CW / 2, CH + THICCNESS / 2 + 1))
    Matter.Body.setPosition(rightWall, Matter.Vector.create(CW + THICCNESS / 2 + 1, CH / 2))
  }

  const throttleUpdate = throttler({ update: handleResize, onlyAtEnd: true })
  window.addEventListener('resize', throttleUpdate)
}

breadPhysics()
