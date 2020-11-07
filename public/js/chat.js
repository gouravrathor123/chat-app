const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// options
const { username, room } =Qs.parse(location.search, { ignoreQueryPrefix: true} )

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    // how far have i scrolled
    const scrolloffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight  <= scrolloffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)

    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users}) => {
   const html = Mustache.render(sidebarTemplate, {
       room,
       users
   })
   document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault()

    document.querySelector('button').setAttribute('disabled', 'disabled')
    //disable
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        document.querySelector('button').removeAttribute('disabled')
        document.querySelector('input').value = ''
        document.querySelector('input').focus()
        //enable
        if(error){
            return console.log(error)
        }

            console.log('message delivered!')
    })
})

document.querySelector('#send-location').addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    document.querySelector('#send-location').setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition( (position) => {
        // console.log(position)
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitute: position.coords.longitude
        }, () => {
            document.querySelector('#send-location').removeAttribute('disabled')
            console.log('location shared')
        })
    })
})

socket.emit('join', { username, room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})