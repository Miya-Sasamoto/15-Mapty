'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];



//ここでrunningとcyclingに共通するデータを取り込む
class Workout {
  //日付も大事な要素です　
  date = new Date(); //その時の日付を取得
  //uniqueなIDを作成して、そのIDを使用して識別できるようにする
  //通常は、何かのライブラリを使ってuniqueなIDを作成するのが一般的
  id = (Date.now() + '').slice(-10);//最後の10文字を出す

  //座標、距離、時間がunningとcyclingに共通しているもの
  constructor(coords,distance,duration){
    this.coords = coords; //座標
    this.distance = distance; //km単位 距離
    this.duration = duration; //分単位　時間
  }
}

//二つのWorkoutクラスを継承したRunningとCyclingクラスを作成
class Running extends Workout{
  type = 'running';
  //追加したいプロパティを設定するのを忘れないで
  constructor(coords,distance,duration,cadence){
    super(coords,distance,duration);
    this.cadence = cadence;
    this.calcPace();
  }
  //ペースを計算するメソッドを作成 min/km
  calcPace(){
    this.pace = this.duration / this.distance;
    return this.pace;
  } //算数の計算
}

class Cycling extends Workout{
  type = 'cycling';

  constructor(coords,distance,duration,elevationGain){
    super(coords,distance,duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  //スピードを計算するメソッドkm/h
  calcSpeed(){
    this.speed = this.distance /  (this.duration / 60);
    //分だからそれを時間に直すためには/60する！
    return this.speed
  }
}

//↓テスト！
// const run1 = new Running([39,-12],5.2,24,178);
// const cycling1 = new Cycling([39,-12],27,95,523);
// console.log(run1);
// console.log(cycling1);


////////////////////////////////////
//APPLICATION ARCHITECTURE
//それぞれのクラスをここにまとめるとわかりやすいです

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');//runingがcyclingかをselect
const inputDistance = document.querySelector('.form__input--distance');//距離入寮
const inputDuration = document.querySelector('.form__input--duration');//時間入力
const inputCadence = document.querySelector('.form__input--cadence'); //1分で何歩歩いたか.ランニングの時に表示
const inputElevation = document.querySelector('.form__input--elevation');//標高を入力。サイクリングの時に表示

class App {

  //プライベートインスタンスフィールドにする場合は#をつけるルール！
  #map;
  #mapEvent;
  #workout = []; //データをpushする空配列

  constructor(){ //引数は入れない

    this._getPostition();
    //'submit'はそのformが送信されたときに発生します
    form.addEventListener('submit',this._newWorkout.bind(this));//このようにbindでthisを紐づけないといけないところは、かなり面倒くさいところではある.(手動でイベントリタッチする時の)

    //runningとcyclingでは入力するフィールドに違いがあるため、toggleでクラスの付け替えをする
    //changeは値が変更された時に発生するイベント
    inputType.addEventListener('change',this._toggleElevetionField);
  }
  //navigatorから地図を介して座標を持ってくる
  _getPostition(){
    if(navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //一つ目の引数は無事にマップの座標が取れた時
        //ここの_loadMapはメソッドではなく、通常の関数として呼び出されている.通常の関数呼び出しでは、thisはundefinedになることを知っている。そのため手動でbindをしてthisとくっつける
        function(){ //二つ目の引数はアラート
          alert('Cound not get youe current position')
        }
      );
  }

  //マップをローディングします
  _loadMap(position){
      // console.log(position);　これだと高度とか全部取れる
      const { latitude } = position.coords; //緯度
      const { longitude } = position.coords; //軽度
      // console.log(`https://www.google.co.jp/maps/@${latitude}.${longitude}`);
        //google mapのリンクというのは軽度と緯度が入っているのでテンプレートリテラルにすることで現在地のmapを出すことができる

      //緯度と経度を一つの変数にまとめる
      const coords = [latitude,longitude];

      //これはleaflet のサイトからそのままコピーした
      console.log(this);
      this.#map = L.map('map').setView(coords, 13);
      // console.log(map);
      //mapの情報を見ることができる

      //leafletのサンプルコードをこのまま持ってきた。titleLayerのところを少し変えると、表示される地図の種類が変わる
      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.#map);

      //Handling clicks on map
      //このon()はleaflet のライブラリに起因。jsのaddEventListenerみたいな感じ
      this.#map.on('click',this._showForm.bind(this));
        //地図をクリックしたときにformを表示させるようにする。
    }

    //左側にあるformを見せる
  _showForm(mapE){
    //元々はformはhiddenクラスがついている
    //⚠️formは左側のrunningとがを入力するやつ
    this.#mapEvent = mapE; //グローバル変数と紐付け
    form.classList.remove('hidden');
    inputDistance.focus(); //focusは表示されたときに、そこにカーソルが当たっている状態にすること.すぐに入力することができる
  }

  //running とcyclingで違うフィールドをここで
  _toggleElevetionField(){
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //ピンを表示する
  _newWorkout(e){
    //入力された値が数値かどうかを確認するrefectalingの関数
    const validInputs = (...inputs) =>  inputs.every(inp => Number.isFinite(inp));
    //(...)のように書くと配列になります
    //配列をループさせて(.every)数が有効かをchkする.
    //everyは全ての値がtrue出ないといけない
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    //入力された値が0以上かを判定する関数

    e.preventDefault();
    //通常、formでは、クリックされた毎回でリロードするのでその動きを防止する

    //①formからデータを取得
    const type = inputType.value;
    //inputTypeはselect要素だが、これもvalueを使って値を取得する
    const distance = +inputDistance.value;
    //常にStringで認識されるが、数値に直すため +をつける
    const duration = +inputDuration.value;
    //時間
    const {lat,lng} = this.#mapEvent.latlng;
    //緯度と経度を取得
    let workout; //空配列にpushされて値は変わっていくので　

  //❗️最近はif/elseはあまり使われない。二つのifを作る方がスッキリ

    //③もしworkoutがrunningならrunningのオブジェクトを作る
    if (type === 'running'){
      const cadence = +inputCadence.value;
      //runningの時に初めてcadence(歩調)を取得
      //②そのデータが有効かをchk.
      if(
        // !Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)
        !validInputs(distance,duration,cadence) || !allPositive(distance,duration,cadence)
      )//!で条件を反射させているのは、notの方がalertに誘導しやすくなる
      return alert('Input have to be positive numbers!');
      //入力値のどれか一つでもNumberでなかったらalertを出す

      workout = new Running([lat,lng],distance,duration,cadence);
    }


    //④もしworkoutがcyclingならcyclingのオブジェクトを作る
    if (type === 'cycling'){
      const elevation = +inputElevation.value;
      //cyclingの時に初めてelevation(標高)を取得
      //②そのデータが有効かをchk.
      if(
        !validInputs(distance,duration,elevation) ||
        !allPositive(distance,duration)
        //cyclingの場合の標高は-になってもいいため、省く
      )
      return alert('Input have to be positive numbers!');
      workout = new Cycling([lat,lng],distance,duration,elevation);
    }

    //⑤新しいデータをworkout配列に追加する
    this.#workout.push(workout);
    console.log(workout);

    //⑦新しいworkOutをformとしてリスト上にレンダリング　

    //⑥workOutを地図上にマーカーとしてレンダリング（画像を生成して表示）
    this.renderWorkoutMarker(workout)

    //入力するフォームを空にして、formをhiddenにする
    inputDistance.value　//form要素だから、.value忘れないで！！！
    = inputDuration.value
    = inputCadence.value
    = inputElevation.value
    = ''; //空文字
  }
  renderWorkoutMarker(workout){
    //このmarkerは📍！
    L.marker(workout.coords) //これで指定された（クリックされた緯度と軽度の場所にピンが表示されるようになったよ）
      .addTo(this.#map) //📍を画面に表示させる
      .bindPopup(L.popup({ 　//これは📍に表示されるメッセージ
        maxWidth : 250, //最長辺
        minWidth : 100, //最短辺
        autoClose : false, //自動でpopupが消える（初期値はtrue)
        closeOnClick : false, //クリックして閉じるのをfalseに
        className : `${workout.type}-popup`,//popupに好きなCSSクラスを割り当てることができる.runningは左端が緑になる
        })
      )
    .setPopupContent('workout') //初期値のメッセージ
    .openPopup();
  }
}

//インスタンス化
const app = new App();
