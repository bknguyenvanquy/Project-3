module.exports = {
    auth: {
        user: 'quynguyenbk98@gmail.com',
        pass: 'conchoxuabcxyz123'
    },
    facebook:{
        clientID:'1880263615402607',
        clientSecret:'6359dd93287bc1bfd6593def893df3a2',
        profileFields: ['email', 'displayName'],
        callbackURL:'http://localhost:3000/auth/facebook/callback',
        passReqToCallback: true
    }
}