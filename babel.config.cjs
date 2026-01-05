module.exports = {
  plugins: [
    [ '@wordpress/babel-plugin-makepot', { 
      output: 'i18n/languages/yatra-js.pot',
      domain: 'yatra'
    } ]
  ]
};
