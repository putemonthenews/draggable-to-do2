//=========================================================
// CONSTANT
//=========================================================

const IN_PROGRESS = "IN_PROGRESS"
const DONE = "DONE"
const TODO = "TODO"
const TRASH = "TRASH"
const INCOMPLETE = "INCOMPLETE"

const STATUS_COLOR = {
  [TODO]: "#F6E05E",
  [IN_PROGRESS]: "#68D391",
  [DONE]: "#63B3ED",
  [TRASH]: "#F687B3",
  [INCOMPLETE]: "#ef4444",
}

//=========================================================
// LOCAL DATABASE
//=========================================================

const DB = (function () {
  if (!localStorage.getItem("todo_app")) {
    localStorage.setItem(
      "todo_app",
      JSON.stringify({
        1: {
          id: 1,
          title: "Сделать домашнюю работу",
          desc: `Успеть до 7 часов вечера.`,
          hours: 3,
          minutes: 32,
          seconds: 60,
          status: TODO,
        },
      })
    )
  }
  return getFromLocalStorage()
})()

// Mengambil database yang ada di localStorage
function getFromLocalStorage() {
  return JSON.parse(localStorage.getItem("todo_app"))
}

// Menyimpan data ke localStorage
function saveToLocalStorage() {
  localStorage.setItem("todo_app", JSON.stringify(DB))
}


// Membuat data todo baru
function createNewTodo(title, desc, hours, minutes, seconds) {
  // Menghitung id berikutnya dengan mencari id tertinggi yang tersedia di database
  // apabila tidak tersidia makan max adalah -Infinity maka perlu dibandikan lagi dengan 0
  // sehingga menjamin id tidak -Infinity.
  const id = Math.max(...Object.keys(DB).map((item) => parseInt(item)), 0) + 1
  DB[id] = {
    id,
    title,
    desc,
    hours,
    minutes,
    seconds,
    status: TODO,
  }
  saveToLocalStorage()
  return { ...DB[id] }
}

// Menandai item todo sebgai 'TODO', 'IN_PROGRESS', 'DONE' atau 'TRASH'
function markTodoAs(id, status) {
  if (DB[id] !== undefined) {
    DB[id].status = status
    saveToLocalStorage()
  }
}

function saveSeconds(id, seconds) {
  if (DB[id] !== undefined) {
    DB[id].seconds = seconds
    saveToLocalStorage() 
  }
}
function saveMinutes(id, minutes) {
  if (DB[id] !== undefined) {
    DB[id].minutes = minutes
    saveToLocalStorage() 
  }
}
function saveHours(id, hours) {
  if (DB[id] !== undefined) {
    DB[id].hours = hours
    saveToLocalStorage() 
  }
}


// Mengembalikan array dari todo yang memiliki status 'TODO'
function getTodoList() {
  return Object.values(DB).filter((item) => item.status === TODO)
}

// Mengembalikan array dari todo yang memiliki status 'IN_PROGRESS'
function getInProgressList() {
  return Object.values(DB).filter((item) => item.status === IN_PROGRESS)
}

// Mengembalikan array dari todo yang memiliki status 'DONE'
function getDoneList() {
  return Object.values(DB).filter((item) => item.status === DONE)
}

// Mengembalikan array dari todo yang memiliki status 'TRASH'
function getTrashList() {
  return Object.values(DB).filter((item) => item.status === TRASH)
}

function getIncompleteList() {
  return Object.values(DB).filter((item) => item.status === INCOMPLETE)
}
// Membersihkan todo dari trash. Dengan demikian todo yang berada di trash
// sudah dihapus secara permanen
function cleanupTrash() {
  const trash = getTrashList()
  for (const item of trash) {
    delete DB[item.id]
  }
  saveToLocalStorage()
}

//=========================================================
// DRAGGABLE
//==========================================================

// Membuat node menjadi draggable (drag origin).
// Sehingga node ini nantinya bisa di drag ke drag target.
function createDragable(node) {
  node.addEventListener(
    "dragstart",
    function (evt) {
      evt.dataTransfer.setDragImage(node, 0, 0)
      node.classList.add("on-drag")
    },
    false
  )

  node.addEventListener("dragend", function (evt) {
    node.classList.remove("on-drag")
    const attrReceiving = node.parentElement.parentElement.dataset.todoName
    if (attrReceiving == 'done') {
      console.log('3');
      node.querySelector('.timeIsUp').textContent = 'Задача выполнена'
      node.querySelector('.todo__timerWrapper').remove()
    }
  })

  return node
}
// Membuat node menjadi drag target.
// Sehingga ketika drag over, node origin yang di drag ke node ini
// akan mejadi child dari node ini.
function createDragableTarget(node) {
  node.addEventListener("dragleave", function (evt) {
    node.classList.remove("on-hover")
  })

  node.addEventListener("dragover", function (evt) {
    node.classList.add("on-hover")
    const onDragItem = document.querySelector(".on-drag")
    const currentChildren = node.querySelectorAll(".card-item")
    
    

    const closest = getClosestNode(currentChildren, evt.clientY)


    if (onDragItem.parentElement.parentElement.dataset.todoName === 'incomplete' || onDragItem.parentElement.parentElement.dataset.todoName === 'trash' || onDragItem.parentElement.parentElement.dataset.todoName === 'done') {
      if (node.dataset.todoName == 'trash') {
        evt.preventDefault()
        
        node.querySelector("ul").insertBefore(onDragItem, closest)
      }
      else {
        return
      }
    }

    if (node !== null) {
      updateStatus(node, onDragItem)
    }
   if (node.dataset.todoName == 'incomplete') {
    return
   }
  
   else {
    evt.preventDefault()
    node.querySelector("ul").insertBefore(onDragItem, closest)
   }
  })

  return node
}

// Mencari node yang memiliki jarak terdekat dengan
// yAxis dari node yang sedang di drag.
// Dengean demikian dapat ditentukan dimana posisi node baru nantinya
// akan ditempatkan.
function getClosestNode(nodes, yAxis) {
  const closest = { dist: -Infinity, node: null }
  nodes.forEach((child) => {
    const boundary = child.getBoundingClientRect()
    const dist = yAxis - boundary.top - boundary.height / 2
    if (dist < 0 && dist > closest.dist) {
      closest.node = child
      closest.dist = dist
    }
  })
  return closest.node
}

// Mengubah status dari todo item secara otomatis
// dengan berdasarkan drag target.
function updateStatus(card, target) {
  const todoId = target.getAttribute("data-todo-id")

  const destinyStatus = card.getAttribute("data-todo-name").toUpperCase()

 if (destinyStatus !== 'INCOMPLETE') {
  target.querySelector(".indicator").style.backgroundColor =
  STATUS_COLOR[destinyStatus]
  markTodoAs(todoId, destinyStatus)
 }

 
}

// =======================================================
//  RENDER
// =======================================================

// Membuat dom tree yang digunakan untuk menampilkan todo ke web page.
// Hasil akhir akan terlihat seperti berikut.
// <li class="card-item" draggable="true"  data-todo-id={todo.id} >
//   <div class="head">
//     <h3>{todo.title}</h3>
//     <span class="indicator"></span>
//   </div>
//   <p>
//      {todo.desc}
//  </p>
// </li>
function createTodoHtmlNode(todo) {
  const li = document.createElement("li")
  li.classList.add("card-item")
  li.setAttribute("draggable", "true")
  li.setAttribute("data-todo-id", todo.id)
  
  const head = document.createElement("div")
  head.classList.add("head")

  const h3 = document.createElement("h3")
  h3.textContent = todo.title

  const span = document.createElement("span")
  span.classList.add("indicator")
  span.style.backgroundColor = STATUS_COLOR[todo.status]

  const p = document.createElement("p")
  p.innerText = todo.desc


  const hours = document.createElement("div")
  hours.classList.add('todo__hours')
  hours.innerText = todo.hours
  
  const minutes = document.createElement("div")
  minutes.classList.add('todo__minutes')
  minutes.innerText = todo.minutes

  const seconds = document.createElement("div")
  seconds.classList.add('todo__seconds')
  seconds.innerText = todo.seconds


  head.appendChild(h3)
  head.appendChild(span)
  li.appendChild(head)
  li.appendChild(p)

  const timeIsUp = document.createElement('div')
  timeIsUp.classList.add('timeIsUp')
  li.appendChild(timeIsUp)
  const todo__timerWrapper = document.createElement('div')
  todo__timerWrapper.classList.add('todo__timerWrapper')
  li.appendChild(todo__timerWrapper)

  todo__timerWrapper.appendChild(hours)
  todo__timerWrapper.appendChild(minutes)
  todo__timerWrapper.appendChild(seconds)


  createDragable(li)

  return li
}


setInterval(() => {
  const timerHours = document.querySelectorAll('.todo__hours')
  const timerMinutes = document.querySelectorAll('.todo__minutes')
  const timerSeconds = document.querySelectorAll('.todo__seconds')
  

    timerSeconds.forEach((timerSecond, idx) => {
      const minute = timerSecond.previousElementSibling;
      const hour = timerSecond.previousElementSibling.previousElementSibling;
      const timeIsUp = timerSecond.parentElement.parentElement.querySelector('.timeIsUp')
      const cardId = (hour.parentElement.parentElement.dataset.todoId);
      if (hour.textContent == 0 && minute.textContent == 0 && timerSecond.textContent == 0) {
        
        

        timeIsUp.textContent = 'Время закончилось'

        setTimeout(() => {
          hour.parentElement.remove() 
        }, 100);

        const incompleteList = document.querySelector('#incomplete-list-container')
        incompleteList.appendChild((hour.parentElement.parentElement))
        hour.parentElement.parentElement.querySelector('.indicator').style.backgroundColor = '#ef4444'
        markTodoAs(cardId, 'INCOMPLETE')
        saveToLocalStorage()
        return
      }
      
      else if (hour.textContent > 0 && timerSecond.textContent == 0 && minute.textContent == 0) {
        minute.textContent = 59
        timerSecond.textContent = 59
        hour.textContent = hour.textContent - 1
        
      }

      else if (timerSecond.textContent == 0) {
        timerSecond.textContent = 59
        minute.textContent = minute.textContent - 1
        
      }
      
      


      else if (hour.textContent >= 0 && minute.textContent >= 0 && timerSecond.textContent >= 0) {
        timerSecond.textContent = parseInt(timerSecond.textContent) - 1
        
        
        saveSeconds(cardId, JSON.stringify(parseInt(timerSecond.textContent)))
        saveMinutes(cardId, JSON.stringify(parseInt(minute.textContent)))
        saveHours(cardId, JSON.stringify(parseInt(hour.textContent)))
      }
      
    })


    

}, 1000);



// Merender node ke todo-list-container
function renderTodoHtmlNode(node) {
  const todoListContainer = document.getElementById("todo-list-container")
  todoListContainer.appendChild(node)
}

// Merender node ke inprogress-list-container
function renderInProgressHtmlNode(node) {
  const inProgressListContainer = document.getElementById(
    "inprogress-list-container"
  )
  inProgressListContainer.appendChild(node)
}

// Merender node ke done-list-container
function renderDoneHtmlNode(node) {
  const doneListContainer = document.getElementById("done-list-container")
  doneListContainer.appendChild(node)
}

// Merender node ke trash-list-container
function renderTrashHtmlNode(node) {
  const trashListContainer = document.getElementById("trash-list-container")

  trashListContainer.appendChild(node)
}


function renderIncompleteHtmlNode(node) {
  const incompleteListContainer = document.getElementById("incomplete-list-container")

  incompleteListContainer.appendChild(node)
}

// =======================================================
// Modal
// =======================================================

// Selector
const modal = document.querySelector(".modal")
const openModal = document.getElementById("open-modal")
const addBtn = document.getElementById("btn-add")
const closeBtn = document.getElementById("btn-close")
const todoDesc = document.getElementById("desc")
const todoTitle = document.getElementById("title")
const todoHours = document.querySelector(".timer__hours")
const todoMinutes = document.querySelector(".timer__minutes")
const todoSeconds = document.querySelector(".timer__seconds")
const titleError = document.getElementById("title-error")
const descError = document.getElementById("desc-error")



// Listener


openModal.addEventListener("click", function (e) {
  modal.classList.add("show")
  modal.classList.remove("disable-pointer")
})

closeBtn.addEventListener("click", (e) => {
  e.preventDefault()
  modal.classList.remove("show")
  modal.classList.add("disable-pointer")
})

todoTitle.addEventListener("focus", (e) => {
  titleError.classList.remove("show")
})

todoDesc.addEventListener("focus", (e) => {
  descError.classList.remove("show")
})

addBtn.addEventListener("click", (e) => {
  e.preventDefault()

  const title = todoTitle.value.trim()
  const desc = todoDesc.value.trim()
  const hours = parseInt(todoHours.value.trim())
  const minutes = parseInt(todoMinutes.value.trim())
  const seconds = parseInt(todoSeconds.value.trim())
  if (!title) {
    titleError.innerText = "Title is required"
    titleError.classList.add("show")
    return
  }

  if (title.length < 4) {
    titleError.innerText = "Title min. 4 charaters."
    titleError.classList.add("show")
    return
  }

  if (!desc) {
    descError.innerText = "Description is required"
    descError.classList.add("show")
    return
  }

  if (desc.length < 6) {
    descError.innerText = "Description min. 6 charaters."
    descError.classList.add("show")
    return
  }




  const newTodo = createNewTodo(title, desc, hours, minutes, seconds)
  renderTodoHtmlNode(createTodoHtmlNode(newTodo))

  todoDesc.value = ""
  todoTitle.value = ""
  todoHours.value = ""
  todoMinutes.value = ""
  todoSeconds.value = ""
  modal.classList.remove("show")
  modal.classList.add("disable-pointer")
})

// =======================================================
// TRASH
// =======================================================
const cleanTrashBtn = document.getElementById("clean-trash")

cleanTrashBtn.addEventListener("click", () => {
  cleanupTrash()
  const trashListContainer = document.getElementById("trash-list-container")
  trashListContainer.innerHTML = ""
})

// ========================================================
// THEME
// ========================================================
const themeBtn = document.querySelector(".toggle-theme")
const themesBox = document.querySelector(".themes")
const themesOpt = document.querySelectorAll(".theme")

const themeColors = [
  "#718096",
  "#F56565",
  "#D69E2E",
  "#38A169",
  "#805AD5",
  "#3182CE",
  "#D53F8C",
]

themeBtn.addEventListener("click", () => {
  themesBox.classList.toggle("show")
  themesBox.classList.toggle("disable-pointer")
  themesBox.classList.toggle("move-down")
})

themesOpt.forEach((item, i) => {
  item.style.backgroundColor = themeColors[i]

  item.addEventListener("click", (e) => {
    themesBox.classList.toggle("show")
    themesBox.classList.toggle("disable-pointer")
    themesBox.classList.toggle("move-down")
    document.body.style.backgroundColor = themeColors[i]
  })
})


// ========================================================
// App
// ========================================================
start()

function start() {
  getTodoList().map(createTodoHtmlNode).forEach(renderTodoHtmlNode)

  getInProgressList().map(createTodoHtmlNode).forEach(renderInProgressHtmlNode)

  getDoneList().map(createTodoHtmlNode).forEach(renderDoneHtmlNode)

  getTrashList().map(createTodoHtmlNode).forEach(renderTrashHtmlNode)

  getIncompleteList().map(createTodoHtmlNode).forEach(renderIncompleteHtmlNode)

  document.querySelectorAll(".card").forEach(createDragableTarget)
}


const incompleteCard = document.querySelector('.incompleteCard')
console.log(incompleteCard);

const incompleteTimes = incompleteCard.querySelectorAll('.timeIsUp')
const todo__timerWrapper = incompleteCard.querySelectorAll('.todo__timerWrapper')
incompleteTimes.forEach((time) => {
  time.textContent = 'Время закончилось'
})
todo__timerWrapper.forEach((wrapper) => {
  wrapper.style.display = 'none'
})


const completeCard = document.querySelector('.completeCard')
const completeTimes = completeCard.querySelectorAll('.timeIsUp')
const completeTimerWrapper = completeCard.querySelectorAll('.todo__timerWrapper')

completeTimes.forEach((time) => {
  time.textContent = 'Задача выполнена'
})
completeTimerWrapper.forEach((wrapper) => {
  wrapper.style.display = 'none'
})


const trashCard = document.querySelector('.garbageCanCard')
const trashTimes = trashCard.querySelectorAll('.timeIsUp')
const trashTimerWrapper = trashCard.querySelectorAll('.todo__timerWrapper')

trashTimes.forEach((time) => {
  time.textContent = ''
})
trashTimerWrapper.forEach((wrapper) => {
  wrapper.remove()
})

// const editIcons = document.querySelectorAll('.editIcon')
// const modalEdit = document.querySelector('.modalEdit')
// const btnEdit = document.querySelector('#btn-edit')
// editIcons.forEach((editIcon) => {
//   editIcon.addEventListener('click', e => {
//     let title = e.target.closest('.card-item').querySelector('.head').querySelector('h3').innerText;
//     let text = e.target.closest('.card-item').querySelector('p').innerText;
//     console.log(title);
//     modalEdit.classList.add('active')
//     modalEdit.querySelector('#titleEdit').value = title;
//     modalEdit.querySelector('#descEdit').value = text;
//   })
//   btnEdit.addEventListener('click', e => {
//     title = modalEdit.querySelector('#titleEdit').value = title;
//     text = modalEdit.querySelector('#descEdit').value = text;
//   })
// })