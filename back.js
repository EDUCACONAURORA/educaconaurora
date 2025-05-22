const express = require('express');
const session = require('express-session');
const app = express();

app.use(session({
    secret: 'tu_secreto',
    resave: false,
    saveUninitialized: true
}));

app.post('/login', (req, res) => {
    // Aquí verificarías contra tu base de datos
    if(req.body.username === "usuario" && req.body.password === "contraseña") {
        req.session.user = req.body.username;
        res.redirect('/dashboard');
    } else {
        res.send('Credenciales incorrectas');
    }
});

app.get('/dashboard', (req, res) => {
    if(req.session.user) {
        res.send(`Bienvenido ${req.session.user}`);
    } else {
        res.redirect('/login');
    }
});

app.listen(3000);