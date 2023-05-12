'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


///232.Using the Geolocation API
//Geolocation API とは国際化、タイマーなど、ブラウザが提供してくれるものと同じようにブラウザのAPIです。もっと近代的です.

if(navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    function(position){//引数で一つ目は成功した時、
      // console.log(position);　これだと高度とか全部取れる
      const { latitude } = position.coords; //緯度
      const { longitude } = position.coords; //軽度
      console.log(`https://www.google.co.jp/maps/@${latitude}.${longitude}`);
        //google mapのリンクというのは軽度と緯度が入っているのでテンプレートリテラルにすることで現在地のmapを出すことができる
    },
    function(){ //二つ目はエラーコールバック
      alert('Cound not get youe current position')
    }
  )
//これだけで、現在の場所をとることができます
//緯度と軽度で示されます
