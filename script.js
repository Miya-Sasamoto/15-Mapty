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

      //緯度と経度を一つの変数にまとめる
      const coords = [latitude,longitude];

      //これはleaflet のサイトからそのままコピーした
      const map = L.map('map').setView(coords, 13);
      // console.log(map);
      //mapの情報を見ることができる

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);



      //このon()はleaflet のライブラリに起因します.
      //jsのaddEventListenerみたいな感じ
      map.on('click',function(mapEvent){
        console.log(mapEvent);
        const {lat,lng} = mapEvent.latlng;
        //クリックしたところの経度と緯度。latlngは緯度と経度を表している

      //このmarkerは📍！
        L.marker([lat,lng]) //これで指定された（クリックされた緯度と軽度の場所にピンが表示されるようになったよ）
          .addTo(map) //📍を画面に表示させる
          .bindPopup(L.popup({ 　//これは📍に表示されるメッセージ
            maxWidth : 250, //最長辺
            minWidth : 100, //最短辺
            autoClose : false, //自動でpopupが消える（初期値はtrue)
            closeOnClick : false, //クリックして閉じるのをfalseに
            className : 'running-popup',//popupに好きなCSSクラスを割り当てることができる.runningは左端が緑になる
          })
        )
          .setPopupContent('Workout') //初期値のメッセージ
          .openPopup();
      });
    },
    function(){ //二つ目はエラーコールバック
      alert('Cound not get youe current position')
    }
  );
//これだけで、現在の場所をとることができます
//緯度と軽度で示されます

// console.log(firstName);
