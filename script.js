'use strict';
//ここでrunningとcyclingに共通するデータを取り込む
class Workout {
  //日付も大事な要素です　
  date = new Date(); //その時の日付を取得
  //uniqueなIDを作成して、そのIDを使用して識別できるようにする
  //通常は、何かのライブラリを使ってuniqueなIDを作成するのが一般的
  id = (Date.now() + '').slice(-10);//最後の10文字を出す
  clicks = 0; //クリック回数は０からスタート

  //座標、距離、時間がunningとcyclingに共通しているもの
  constructor(coords,distance,duration){
    this.coords = coords; //座標
    this.distance = distance; //km単位 距離
    this.duration = duration; //分単位　時間
  }

  _setDescription(){
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    //テンプレートリテラルを使って、説明文を書く
    //Running(最初だけ大文字)on 日付
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    //Month[this.date.getMonth()]なのは、配列が0ベースなので、arrayにするとちょうどいいから。
  }
  click(){
    this.clicks++;
    //左側のリストをクリックする度にここがインクリメントされていく感じ。
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
    this._setDescription();
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
    this._setDescription();
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
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = []; //データをpushする空配列

   constructor(){ //引数は入れない
     ///GET USER POSITION///
    this._getPostition();

    ///GET DATA FROM LOCAL STORAGE///
    this._getLocalStorage();

    ///ATTACH EVENT HANDLER///
    //'submit'はそのformが送信されたときに発生します
    form.addEventListener('submit',this._newWorkout.bind(this));//このようにbindでthisを紐づけないといけないところは、かなり面倒くさいところではある.(手動でイベントリタッチする時の)

    //runningとcyclingでは入力するフィールドに違いがあるため、toggleでクラスの付け替えをする
    //changeは値が変更された時に発生するイベント
    inputType.addEventListener('change',this._toggleElevetionField);
    containerWorkouts.addEventListener('click',this._moveToPopup.bind(this))
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
      this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
      // console.log(map);
      //mapの情報を見ることができる

      //leafletのサンプルコードをこのまま持ってきた。titleLayerのところを少し変えると、表示される地図の種類が変わる
      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.#map);

      //Handling clicks on map
      //このon()はleaflet のライブラリに起因。jsのaddEventListenerみたいな感じ
      this.#map.on('click',this._showForm.bind(this));

      this.#workouts.forEach(work => {
        this._renderWorkoutMarker(work);
      });

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

  _hideForm(){
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.style.display = 'none';
    //このhiddenクラスは自動的にanimationのトリガーになる
    form.classList.add('hidden');
    //1秒後にgridの状態に戻すようにする
    setTimeout(() => form.style.display = 'grid',1000);
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
    this.#workouts.push(workout);

    //⑦新しいworkOutをformとしてリスト上にレンダリング　
    this._renderWorkout(workout);


    //⑥workOutを地図上にマーカーとしてレンダリング（画像を生成して表示）
    this._renderWorkoutMarker(workout)

    //入力するフォームを空にして、formをhiddenにする
    this._hideForm();

    //ローカルストレージに全てのworkoutを保存する
    this._setLocalStprage();

  }

  _renderWorkoutMarker(workout){
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
    .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴'} ${workout.description}`) //マップのピンのところに表示されるメッセージ
    .openPopup();
  }

  _renderWorkout(workout){
    //DOM操作を基本的に行う.新しいworkoutがあるたびに、DOMに追加していくhtmlで操作をすると簡単
    //後からrunningとcyclingで違うhtmlを追加するのでletで定義
    let html =`
        <li class="workout workout--${workout
        .type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    //runningの時に使用されるhtmlをここで+=で追加できる
    if(workout.type === 'running')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
      //paceのtoFixed(1)は小数点以下一桁に修正する
    if(workout.type === 'cycling')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    form.insertAdjacentHTML('afterend',html);
  }

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout');

    if(!workoutEl) return; //workoutElがなかったら何もしない

    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
    //idが同じものを見つける
    console.log(workout);

    //leafletには地図の中心の経緯度とズームレベルを指定できる
    // 第一引数は座標、第二引数はズームレベル
    this.#map.setView(workout.coords,this.mapZoomLevel,{
      animate :true,
      pan: {
        duration :1,
      },
    });

    //Using public interface
    // workout.click();
  }
    _setLocalStprage(){
      //このlocalStorageはwebAPIなので、無料で使うことができるライブラリです
      //一つ目の引数は名前、二つ目の引数は、保存したい文字列を指定.一つ目の引数とキーで関連付ける必要がある
      //JSON.stringify() メソッドは、ある JavaScript のオブジェクトや値を JSON 文字列に変換します。
      localStorage.setItem('wourkouts',JSON.stringify(this.#workouts));
      //⏫これだけ。これだけでローカルストレージに保存できる。非常にシンプルなAPI
    }

    _getLocalStorage(){
      //getItemはデータを取得できる keyを手がかりにして
      const data = JSON.parse(localStorage.getItem('wourkouts'));
      //JSON.parseはJSON.stringifyの逆
      //文字列を JSON として解析し、文字列によって記述されている JavaScript の値やオブジェクトを返す
      //しかしこのようにlocal storageからくる値は、以前のように全てのメソッドを継承することができないことを覚えておくように

      //ストアされているdataがない時は何もしない
      if(!data) return;

      //local storageにデータがある場合は、dataがその#workoutにpushされたデータである
      this.#workouts = data;

      //この_renderWorkoutをここに書くことによって、リロードした時にすぐに左側に表示されるようになる
      this.#workouts.forEach(work => {
        this._renderWorkout(work);
        //_renderWorkoutは左側にリストをしていくやつ
        // this._renderWorkoutMarker(work);
        //_renderWorkoutMarkerは地図上のピン
        //実はこの場所だと、エラーが出る。なぜなら地図上にピンを表示するという作業は「地図を読み込んで、場所を読み込んで、からの地図にピンを立てるという流れになるので、JSの非同期処理の関係でこの時点ではまだ読み込まれていないのです。エラーになる
        //⇨_renderWorkoutMarkerは_loadMapのところに移動した
      });
    }
    //local storageに入ったデータを消す方法
      reset(){
        localStorage.removeItem('wourkouts');
        location.reload();
        //locationは基本的にブラウザで提供されているwebAPIみたいな感じ
        //実際の消し方は、app.reset()ってやると消えて、自動的にリロードされるよ
      }
}

//インスタンス化
const app = new App();
