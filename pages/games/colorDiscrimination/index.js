//index.js
//获取应用实例
const app = getApp()
Page({
  data:{
    slideImgArr: [
      'cloud://pass-model-7g3fo4ig00002b96.7061-pass-model-7g3fo4ig00002b96-1304449250/images/games/colorDis/colorDis01.png',
      'cloud://pass-model-7g3fo4ig00002b96.7061-pass-model-7g3fo4ig00002b96-1304449250/images/games/colorDis/colorDis02.png'],//之后再插入游戏图片
    indicatorDots: true, // 是否显示面板指示点
    autoplay: true,      // 是否自动切换
    circular: true,      // 是否采用衔接滑动
    interval: 3000,      // 自动切换时间间隔
    duration: 1000,      // 滑动动画时长

    startGame: false, //是否开始游戏
    gameHeight: '0',

    time:'100',//限定时间100s
    mTime:100000,//以毫秒为单位
    timer:null,

    checkpoint:0,
    colorRGB:['rgb(255,0,0)','rgb(255,165,0)','rgb(50,205,50)','rgb(30,144,255)','rgb(138,43,226)','rgb(255,192,203)','rgb(112,128,144)','rgb(188,143,143)'],
    colorFont:['红','橙','绿','蓝','紫','粉','灰','棕'],
    colorGroup:[],
    answerArr:[],//存放用户的答案
    
    checkBtn:null,

    wordShow:true,
    length:570,

    rightRate:0,//正确率
    score:0,//分数
    grade:'',//等级
    gradeImg:'',

    gradeShow:false,

    testFlag:0,


  },
  onLoad: function () {//页面打开时执行的操作
    //每个手机的屏幕宽度是750rpx 分辨率不一致
    //所有手机在小程序中的宽:真实宽度=小程序在页面中的高度:真实高度
    var res = wx.getSystemInfoSync();
    var rate = 750/res.windowWidth;
    this.setData({
      rate:rate,
      gameHeight : rate*res.windowHeight,
    })
    this.createColorGroup();
  },
  createColorGroup:function(){
    var arr = [];
    var i = 0;
    while(i<10){
      var random1 = Math.floor(Math.random()*8);
      var random2 = Math.floor(Math.random()*8);
      if(i>0&&(random1==arr[i-1].text||random2==arr[i-1].color)||random1==random2){//生成各不相同的
        continue;
      }
      arr.push({text:random1,color:random2});
      i++;
    }
    var count = Math.floor(Math.random()*(7-3)+3);//有3-7个相同的
    i=0;
    while(i<count){
      var random = Math.floor(Math.random()*10);
      if(arr[random].color==arr[random].text){
        continue;
      }
      arr[random].color=arr[random].text;
      i++;
    }
      
    this.setData({
      colorGroup:arr,
    })
        
  },
  start:function(e){
    //当开始游戏按钮被点击时，隐藏视觉搜索介绍
    this.setData({
      startGame:true,
      mTime:this.data.time*1000,
    })
    this.drawActive();

    var countDownNum = 2;
    var this2 = this;
    var timer = setInterval(function(){
      countDownNum--;
      if(countDownNum==0){
        this2.setData({
          wordShow:false
        })
        clearInterval(timer);
      }
    },1000)
  },
  drawActive:function(){
    //设置定时器，一百毫秒执行一次
    //一百毫秒执行一次，要在mTime时间内画一条线
    //比如100000ms，要进行100000/100=1000次画,1000次画满（700-50)/1000
    var this2 = this;
    var timer = setInterval(function(){
      //现在的长度/原来的长度
      //(this2.data.time*1000-this2.data.mTime)/(this2.data.time*1000)
      var length = 570*(this2.data.mTime)/(this2.data.time*1000);
      var currentTime = this2.data.mTime-100;
      this2.setData({
        mTime:currentTime
      });
      if(length>0){
        var lineWidth = 10/this2.data.rate;//px
        var ctx = wx.createCanvasContext('progress_active');//不需要'#'
        ctx.setLineCap('butt');
        ctx.setLineWidth(lineWidth);
        ctx.setStrokeStyle('#ffffff');
        ctx.beginPath();
        ctx.moveTo(0, 80/this2.data.rate);
        ctx.lineTo(length/this2.data.rate, 80/this2.data.rate);
        ctx.stroke();
        ctx.draw();
        this2.setData({
          length:length
        })
      }else{
        clearInterval(this2.data.timer);
        this2.getScore();
        this2.getGrade();
        this2.showGrade();
      }
    },100);
    this2.setData({
      timer:timer
    })
  },
  same:function(){
    this.setData({
      checkBtn:true
    })
    this.afterTrueOrFalse();
    
  },
  notSame:function(){
    this.setData({
      checkBtn:false
    })
    this.afterTrueOrFalse();
  },
  afterTrueOrFalse:function(e){
    var tf = this.data.checkBtn;
    var arr = this.data.answerArr;
    var count = this.data.checkpoint;
    console.log(count);
    if(count<10){
      count++
      arr.push(tf);
      if(count!=10){
        this.setData({
          wordShow:true,
          answerArr:arr,
          checkpoint:count
        });
      }
      var countDownNum = 2;
      var this2 = this;
      var timer = setInterval(function(){
        countDownNum--;
        if(countDownNum==0){
          this2.setData({
            wordShow:false
          })
          clearInterval(timer);
        }
      },1000)
    }
    if(count==10){
      clearInterval(this.data.timer);
      
      wx.showModal({
        title: '提示',
        content:'你已完成颜色判别的所有题目！',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            this2.getScore();
            this2.getGrade();
            this2.showGrade();
          } else if (res.cancel) {
            //点击取消按钮
          }
        }
      })
    }
  },
  getScore:function(){
    var useTime = (this.data.time*1000-this.data.mTime)/1000
    var group = this.data.colorGroup;
    var answer = this.data.answerArr;
    var score = 0;
    for(var i = 0; i < 10; i++){
      var x = (group[i].text==group[i].color);
      var y = answer[i];
      if(x==y){
        score++;
      }
    }
    console.log(useTime);
    score = 0.1*score*(this.data.time-useTime+20)/this.data.time*100;
    console.log(score);
    this.setData({
      score:score
    })
  },
  getGrade:function(){
    var score = this.data.score;
    var grade = '';
    var gradeImg = '';
    if(score>=90)
    { 
      grade = 'A'; 
      gradeImg = 'cloud://pass-model-7g3fo4ig00002b96.7061-pass-model-7g3fo4ig00002b96-1304449250/images/level/level-A.png'
    }else if(score<90&&score>=75) {
      grade = 'B'; 
      gradeImg = 'cloud://pass-model-7g3fo4ig00002b96.7061-pass-model-7g3fo4ig00002b96-1304449250/images/level/level-B.png'
    }else if(score<75&&score>=60) { 
      grade = 'C'; 
      gradeImg = 'cloud://pass-model-7g3fo4ig00002b96.7061-pass-model-7g3fo4ig00002b96-1304449250/images/level/level-C.png'
    }else{ 
      grade = 'D'; 
      gradeImg = 'cloud://pass-model-7g3fo4ig00002b96.7061-pass-model-7g3fo4ig00002b96-1304449250/images/level/level-D.png'
    }
    this.setData({
      grade:grade,
      gradeImg:gradeImg
    })
    console.log("等级："+grade);
  },
  showGrade:function(){
    this.setData({
      gradeShow:true
    })
  },
  gradeConfirm:function(){//点击确定后
    //跳转到游戏界面
    if(this.data.testFlag==0)
    {
      wx.reLaunch({
        url: '/pages/games/index',
      })
    }else if(this.data.testFlag==1){
      wx.redirectTo({
        url: '/pages/games/visualSearch/index?testFlag=1',
      })
    }else{
      wx.reLaunch({
        url: '/pages/training/index',
      })
    }
  },
  onHide:function(){
    clearInterval(this.data.timer);
  },
  onUnload:function(){
    clearInterval(this.data.timer);
  }
})