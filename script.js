'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');//距離入寮
const inputDuration = document.querySelector('.form__input--duration');//時間入力
const inputCadence = document.querySelector('.form__input--cadence'); //1分で何歩歩いたか.ランニングの時に表示
const inputElevation = document.querySelector('.form__input--elevation');//標高を入力。サイクリングの時に表示

let map,mapEvent;
//グローバル変数として定義し直し

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
     map = L.map('map').setView(coords, 13);
      // console.log(map);
      //mapの情報を見ることができる

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);


      //Handling clicks on map
      //このon()はleaflet のライブラリに起因します.
      //jsのaddEventListenerみたいな感じ
      map.on('click',function(mapE){
        //地図をクリックしたときにformを表示させるようにする。
        //元々はformはhiddenクラスがついています
        //formは左側のrunningとがを入力するやつ
        mapEvent = mapE; //グローバル変数と紐付け
        form.classList.remove('hidden');
        inputDistance.focus(); //focusは表示されたときに、そこにカーソルが当たっている状態にすること.すぐに入力することができる



      });
    },
    function(){ //二つ目はエラーコールバック
      alert('Cound not get youe current position')
    }
  );
//これだけで、現在の場所をとることができます
//緯度と軽度で示されます
//'submit'はそのformが送信されたときに発生します
form.addEventListener('submit',function(e){
  e.preventDefault();
  //通常、formでは、クリックされた毎回でリロードするのでその動きを防止する

  //入力するフォームを空にする作業　(全て！）)
  inputDistance.value
  = inputDuration.value
  = inputCadence.value
  = inputElevation.value
  = ''; //form要素だから、.value忘れないで！！！

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

//runningとcyclingでは入力するフィールドに違いがあるため、toggleでクラスの付け替えをする
inputType.addEventListener('change',function(){
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
})

// console.log(firstName);
