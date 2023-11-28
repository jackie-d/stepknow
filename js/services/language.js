export const LanguageService = {

    language: 'es',

    languageDetails: {
      'es': {
          'wiki': 'es',
          'tts': 'es'
      },
      'en': {
        'wiki': 'en',
        'tts': 'en'
      }
    },
    
    init: function() {



    },

    getTtsLanguage: function() {
      return this.languageDetails[this.language].tts;
    },

};