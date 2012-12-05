/*
 * unit tests for notification.js
 */

var assert = require('assert');
var util = require('util');

var config = require('../lib/config');
var handy = require('../lib/handy');
var logger = require('../lib/logger');
var solr = require('../lib/solr');

var gDeviceTypeIphone = 'iphone';
var gDeviceTypeAndroid = 'android';

var dateIdPrefix = "date:";
var geoDateData = [
               {id:dateIdPrefix+'Gucheng', type:"date", title:'google 古城 Gucheng', pointLatLon:'39.907103,116.189346',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Shijingshan', gender:'male', userId:'1',
                   dateDate:1346903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Gongzhufen', type:"date", title:'google 公主坟 Gongzhufen', pointLatLon:'39.907498,116.310196',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Haidian', gender:'female', userId:'2',
                   dateDate:1347903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Fuxingmen', type:"date", title:'google 复兴门 Fuxingmen', pointLatLon:'39.907366,116.356716',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'male', userId:'3',
                   dateDate:1348903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Fuchengmen', type:"date", title:'google 阜成门 Fuchengmen', pointLatLon:'39.923429,116.355343',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'female', userId:'4',
                   dateDate:1349903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Chegongzhuang', type:"date", title:'google 车公庄 Chegongzhuang', pointLatLon:'39.932644,116.355515',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'male', userId:'1',
                   dateDate:1350903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Xizhimen', type:"date", title:'google 西直门 Xizhimen', pointLatLon:'39.940278,116.355171',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'female', userId:'2',
                   dateDate:1351903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Jishuitan', type:"date", title:'google 积水潭 Jishuitan', pointLatLon:'39.950675,116.372509',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'male', userId:'3',
                   dateDate:1352903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Guloudajie', type:"date", title:'google 鼓楼大街 Guloudajie', pointLatLon:'39.948832,116.393623',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'female', userId:'4',
                   dateDate:1353903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Andingmen', type:"date", title:'google 安定门 Andingmen', pointLatLon:'39.949359,116.407871',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Dongcheng', gender:'male', userId:'1',
                   dateDate:1354903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Yonghegong', type:"date", title:'google 雍和宫 Yonghegong', pointLatLon:'39.949753,116.415253',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Dongcheng', gender:'female', userId:'2',
                   dateDate:1355903100784, createTime:'1346903100784', finalConfirmed:false},
               {id:dateIdPrefix+'Dongzhimen', type:"date", title:'google 东直门 Dongzhimen', pointLatLon:'39.942252,116.432076',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Dongcheng', gender:'male', userId:'3',
                   dateDate:1356903100784, createTime:'1346903100784', finalConfirmed:true},
               {id:dateIdPrefix+'Jianguomen', type:"date", title:'google 建国门 Jianguomen', pointLatLon:'39.908946,116.43568',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Chaoyang', gender:'female', userId:'4',
                   dateDate:1357903100784, createTime:'1346903100784', finalConfirmed:true},
               {id:dateIdPrefix+'Sihuidong', type:"date", title:'google 四惠东 Sihuidong', pointLatLon:'39.908551,116.514816',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Chaoyang', gender:'male', userId:'1',
                   dateDate:1358903100784, createTime:'1346903100784', finalConfirmed:true},
               {id:dateIdPrefix+'Tuqiao', type:"date", title:'google 土桥 Tuqiao', pointLatLon:'39.873253,116.688538',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Tongzhou', gender:'female', userId:'2',
                   dateDate:1359903100784, createTime:'1346903100784', finalConfirmed:true},
               {id:dateIdPrefix+'Gongyixiqiao', type:"date", title:'google 公益西桥 Gongyixiqiao', pointLatLon:'39.835564,116.370964',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Fengtai', gender:'male', userId:'3',
                   dateDate:1360903100784, createTime:'1346903100784', finalConfirmed:true},
               {id:dateIdPrefix+'Tiangongyuan', type:"date", title:'google 天宫院 Tiangongyuan', pointLatLon:'39.669935,116.319466',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Daxing', gender:'female', userId:'4',
                   dateDate:1361903100784, createTime:'1346903100784', finalConfirmed:true},
               {id:dateIdPrefix+'Huangzhuang', type:"date", title:'google 黄庄 Huangzhuang', pointLatLon:'39.977515,116.318779',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Haidian', gender:'male', userId:'1',
                   dateDate:1362903100784, createTime:'1346903100784', finalConfirmed:true},
               {id:dateIdPrefix+'Anheqiaobei', type:"date", title:'google 安河桥北 Anheqiaobei', pointLatLon:'40.012496,116.269684',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Haidian', gender:'female', userId:'2',
                   dateDate:1363903100784, createTime:'1346903100784', finalConfirmed:true},
               {id:dateIdPrefix+'Xierqi', type:"date", title:'google 西二旗 Xierqi', pointLatLon:'40.052848,116.304703',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Haidian', gender:'male', userId:'3',
                   dateDate:1364903100784, createTime:'1346903100784', finalConfirmed:true},
               {id:dateIdPrefix+'Nanshao', type:"date", title:'google 南邵 Nanshao', pointLatLon:'40.206541,116.288223',
                   countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Changping', gender:'female', userId:'4',
                   dateDate:1365903100784, createTime:'1346903100784', finalConfirmed:true}
             ];
var userIdPrefix = "user:";
var geoUserData = [
                   {id:userIdPrefix+'Gucheng', type:"user", name:'google 古城 Gucheng', pointLatLon:'39.907103,116.189346',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Shijingshan', gender:'male',
                       emailAccount:'11@abc.com', height:1.70, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Gongzhufen', type:"user", name:'google 公主坟 Gongzhufen', pointLatLon:'39.907498,116.310196',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Haidian', gender:'female',
                       emailAccount:'12@abc.com', height:1.71, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Fuxingmen', type:"user", name:'google 复兴门 Fuxingmen', pointLatLon:'39.907366,116.356716',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'male',
                       emailAccount:'13@abc.com', height:1.72, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Fuchengmen', type:"user", name:'google 阜成门 Fuchengmen', pointLatLon:'39.923429,116.355343',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'female',
                       emailAccount:'14@abc.com', height:1.73, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Chegongzhuang', type:"user", name:'google 车公庄 Chegongzhuang', pointLatLon:'39.932644,116.355515',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'male',
                       emailAccount:'15@abc.com', height:1.74, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Xizhimen', type:"user", name:'google 西直门 Xizhimen', pointLatLon:'39.940278,116.355171',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'female',
                       emailAccount:'16@abc.com', height:1.75, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Jishuitan', type:"user", name:'google 积水潭 Jishuitan', pointLatLon:'39.950675,116.372509',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'male',
                       emailAccount:'17@abc.com', height:1.76, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Guloudajie', type:"user", name:'google 鼓楼大街 Guloudajie', pointLatLon:'39.948832,116.393623',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Xicheng', gender:'female',
                       emailAccount:'18@abc.com', height:1.77, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Andingmen', type:"user", name:'google 安定门 Andingmen', pointLatLon:'39.949359,116.407871',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Dongcheng', gender:'male',
                       emailAccount:'19@abc.com', height:1.78, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Yonghegong', type:"user", name:'google 雍和宫 Yonghegong', pointLatLon:'39.949753,116.415253',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Dongcheng', gender:'female',
                       emailAccount:'20@abc.com', height:1.79, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:false},
                   {id:userIdPrefix+'Dongzhimen', type:"user", name:'google 东直门 Dongzhimen', pointLatLon:'39.942252,116.432076',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Dongcheng', gender:'male',
                       emailAccount:'21@abc.com', height:1.70, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:true},
                   {id:userIdPrefix+'Jianguomen', type:"user", name:'google 建国门 Jianguomen', pointLatLon:'39.908946,116.43568',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Chaoyang', gender:'female',
                       emailAccount:'22@abc.com', height:1.71, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:true},
                   {id:userIdPrefix+'Sihuidong', type:"user", name:'google 四惠东 Sihuidong', pointLatLon:'39.908551,116.514816',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Chaoyang', gender:'male',
                       emailAccount:'23@abc.com', height:1.72, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:true},
                   {id:userIdPrefix+'Tuqiao', type:"user", name:'google 土桥 Tuqiao', pointLatLon:'39.873253,116.688538',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Tongzhou', gender:'female',
                       emailAccount:'24@abc.com', height:1.73, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:true},
                   {id:userIdPrefix+'Gongyixiqiao', type:"user", name:'google 公益西桥 Gongyixiqiao', pointLatLon:'39.835564,116.370964',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Fengtai', gender:'male',
                       emailAccount:'25@abc.com', height:1.74, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:true},
                   {id:userIdPrefix+'Tiangongyuan', type:"user", name:'google 天宫院 Tiangongyuan', pointLatLon:'39.669935,116.319466',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Daxing', gender:'female',
                       emailAccount:'26@abc.com', height:1.75, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:true},
                   {id:userIdPrefix+'Huangzhuang', type:"user", name:'google 黄庄 Huangzhuang', pointLatLon:'39.977515,116.318779',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Haidian', gender:'male',
                       emailAccount:'27@abc.com', height:1.76, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:true},
                   {id:userIdPrefix+'Anheqiaobei', type:"user", name:'google 安河桥北 Anheqiaobei', pointLatLon:'40.012496,116.269684',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Haidian', gender:'female',
                       emailAccount:'28@abc.com', height:1.77, deviceType:gDeviceTypeIphone,
                       createTime:'1346903100784', disabled:true},
                   {id:userIdPrefix+'Xierqi', type:"user", name:'google 西二旗 Xierqi', pointLatLon:'40.052848,116.304703',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Haidian', gender:'male',
                       emailAccount:'29@abc.com', height:1.78, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:true},
                   {id:userIdPrefix+'Nanshao', type:"user", name:'google 南邵 Nanshao', pointLatLon:'40.206541,116.288223',
                       countryCode:'CN', country:'China', state:'Beijing', city:'Beijing', county:'Changping', gender:'female',
                       emailAccount:'30@abc.com', height:1.79, deviceType:gDeviceTypeAndroid,
                       createTime:'1346903100784', disabled:true}
                 ];

var host = 'localhost';// '192.168.171.2'; //'localhost';
var port = 8983;
var commitWithin = 1000;//
var threadInterval = 1000;

var dataLen = 2;//geoDateData.length;

function busInitGeoData(params,cbFun){
  var solrClient = params.solrClient;
  var commitWithin = params.commitWithin;
  var threadInterval = params.threadInterval;
  var geoData = params.geoData;
  solrClient.deleteAllByJson({},function(err){
    assert.ifError(err);
    solrClient.getCount({},function(err,count){
      assert.ifError(err);
      assert.ok(count == 0);

      solrClient.setArrayByJson({items:geoData},function(err){
        assert.ifError(err);
        setTimeout(function(){
          solrClient.getCount({},function(err,count){
            assert.ifError(err);
            assert.ok(count == geoData.length);

            if (cbFun) return cbFun(null);

          });//getCount
        },commitWithin*2);//setTimeout
      });//setArrayByJson
    });//getCount
  });//deleteAllByJson
};//busInitGeoData

function test_deleteAll_setArray_getCount_1(params,next){
  var solrClient = solr.create({host:host,port:port,commitWithin:commitWithin,threadInterval:threadInterval});
  solrClient.deleteAllByJson({},function(err){
    assert.ifError(err);
    solrClient.getCount({},function(err,count){
      assert.ifError(err);
      assert.ok(count == 0);
      console.log("\nafter delete all, count="+count);

      var data = geoDateData.slice(0,dataLen);
      solrClient.setArrayByJson({items:data},function(err){
        assert.ifError(err);
        setTimeout(function(){
          solrClient.getCount({},function(err,count){
            assert.ifError(err);
            assert.ok(count == data.length);
            console.log("\nafter insert array, count="+count);

            solrClient.close();
            if (next) return next();

          });//getCount
        },commitWithin*2);//setTimeout
      });//setArrayByJson
    });//getCount
  });//deleteAllByJson
};//test_deleteAll_setArray_getCount_1



function test_deleteAll_setArray_getCount_2(params,next){
  var solrClient = solr.create({host:host,port:port,commitWithin:commitWithin,threadInterval:threadInterval});
  solrClient.deleteAllByJson({},function(err){
    assert.ifError(err);
    solrClient.getCount({},function(err,count){
      assert.ifError(err);
      assert.ok(count == 0);
      console.log("\nafter delete all, count="+count);

      solrClient.setArrayByJson({items:geoDateData},function(err){
        assert.ifError(err);
        setTimeout(function(){
          solrClient.getCount({},function(err,count){
            assert.ifError(err);
            assert.ok(count == geoDateData.length);
            console.log("\nafter insert array, count="+count);

            solrClient.deleteAllByJson({},function(err){
              assert.ifError(err);
              solrClient.getCount({},function(err,count){
                assert.ifError(err);
                assert.ok(count == 0);
                console.log("\nafter delete all, count="+count);

                solrClient.close();
                if (next) return next();
              });//getCount
            });//deleteAllByJson

          });//getCount
        },commitWithin*2);//setTimeout
      });//setArrayByJson
    });//getCount
  });//deleteAllByJson
};//test_deleteAll_setArray_getCount_2


function test_solrThread(params,next){
  var solrClient = solr.create({host:host,port:port,commitWithin:commitWithin,threadInterval:threadInterval});
  solrClient.deleteAllByJson({},function(err){
    assert.ifError(err);
    solrClient.getCount({},function(err,count){
      assert.ifError(err);
      assert.ok(count == 0);
      console.log("\nafter delete all, count="+count);

        solrClient.addDocToQueue(geoDateData[0]);
        solrClient.addDocToQueue(geoDateData[1]);

        setTimeout(function(){
          solrClient.getCount({},function(err,count){
            assert.ifError(err);
            assert.ok(count == 2);
            console.log("\nafter addDocToQueue and wait enough time, count="+count);

            solrClient.close();
            if (next) return next();

          });//getCount
        },solrClient.threadInterval*2+commitWithin*2);//setTimeout

    });//getCount
  });//deleteAllByJson
};//test_solrThread



function test_queryDateSortByDistance_withInitData(params,next){
  var solrClient = solr.create({host:host,port:port,commitWithin:commitWithin,threadInterval:threadInterval});
  busInitGeoData({solrClient:solrClient, commitWithin:commitWithin,threadInterval:threadInterval,geoData:geoDateData},function(){
    test_client_queryDateSortByDistance_withExistData({solrClient:solrClient},next);
  });//busInitGeoData
};//test_queryDateSortByDistance_withInitData



function test_client_queryDateSortByDistance_withExistData(params,next){
    var solrClient = params.solrClient;
    if (!solrClient)
      solrClient = solr.create({host:host,port:port,commitWithin:commitWithin,threadInterval:threadInterval});

    var pointLatLon = "39.907366,116.356716";  //Fuxingmen
    var pointLatLon2 = "39.940278,116.355171"; //Xizhimen
    var start = 0;
    var count = 200;
    var gender = 'male';
    var excludeUserId = "1";
    var dateDateStart = 1352903100784;
    var dateDateEnd = 1360903100784;
    var county = "Xicheng";// "xicheng"; case-sensitive

    var excludeCandidateId = "1";
    var finalConfirmed = false;
    var strFields = "";

    var pageCount = 4;
    var allDocs = null;

    handy.pipeline(
        function(next){
          console.log("\nget all data");
          var params = {pointLatLon:pointLatLon,start:start,count:count};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            allDocs = solrRetObj.response.docs;
            next();
          });//queryDateSortByDistance
        },
        function(next){
          console.log("\nget page 1, pageSize="+pageCount);
          var pageIndex = 0;
          var params = {pointLatLon:pointLatLon,start:pageCount*pageIndex,count:pageCount};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;

            for(var i=0; i<pageCount; i++){
              assert.ok( allDocs[pageCount*pageIndex+i].id == docs[i].id);
            }

            next();
          });//queryDateSortByDistance
        },
        function(next){
          console.log("\nget page 2, pageSize="+pageCount);
          var pageIndex = 1;
          var params = {pointLatLon:pointLatLon,start:pageCount*pageIndex,count:pageCount};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;

            for(var i=0; i<pageCount; i++){
              assert.ok( allDocs[pageCount*pageIndex+i].id == docs[i].id);
            }

            next();
          });//queryDateSortByDistance
        },
        function(next){
          console.log("\nget page 1 at point 2 to check if have cache, pageSize="+pageCount);
          var pageIndex = 0;
          var params = {pointLatLon:pointLatLon2,start:pageCount*pageIndex,count:pageCount};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);

            next();
          });//queryDateSortByDistance
        },

        function(next){
          console.log("\nget by gender "+ gender);
          var params = {pointLatLon:pointLatLon,gender:gender};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
            }
            next();
          });//queryDateSortByDistance
        },

        function(next){
          console.log("\nget by gender and excludeUserId:"+ gender+", "+excludeUserId);
          var params = {pointLatLon:pointLatLon,gender:gender,excludeUserId:excludeUserId};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
              assert.ok( docs[i].userId != excludeUserId);
            }
            next();
          });//queryDateSortByDistance
        },

        function(next){
          console.log("\nget by gender and excludeUserId and dateDateStart:"+ gender+", "+excludeUserId+", "+dateDateStart);
          var params = {pointLatLon:pointLatLon,gender:gender,excludeUserId:excludeUserId,dateDateStart:dateDateStart};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
              assert.ok( docs[i].userId != excludeUserId);
              assert.ok( docs[i].dateDate - 0 >= dateDateStart);
            }
            next();
          });//queryDateSortByDistance
        },

        function(next){
          console.log("\nget by gender and excludeUserId and dateDateStart and dateDateEnd:"+ gender+", "+excludeUserId+", "+dateDateStart+", "+dateDateEnd);
          var params = {pointLatLon:pointLatLon,gender:gender,excludeUserId:excludeUserId,dateDateStart:dateDateStart,dateDateEnd:dateDateEnd};
          console.log("queryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
              assert.ok( docs[i].userId != excludeUserId);
              assert.ok( docs[i].dateDate - 0 >= dateDateStart);
              assert.ok( docs[i].dateDate - 0 <= dateDateEnd);
            }
            next();
          });//queryDateSortByDistance
        },

        function(next){
          console.log("\nget by gender and excludeUserId and dateDateStart and county:"+ gender+", "+excludeUserId+", "+dateDateStart+", "+county);
          var params = {pointLatLon:pointLatLon,gender:gender,excludeUserId:excludeUserId,dateDateStart:dateDateStart, county:county};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
              assert.ok( docs[i].userId != excludeUserId);
              assert.ok( docs[i].dateDate - 0 >= dateDateStart);
            }
            next();
          });//queryDateSortByDistance
        },

        function(next){
          console.log("\ntry get by empty-to-notExist field");
          var params = {pointLatLon:pointLatLon,start:start,count:count,excludeCandidateId:excludeCandidateId};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length == allDocs.length);
            next();
          });//queryDateSortByDistance
        },

        function(next){
          console.log("\nget by finalConfirmed "+ finalConfirmed);
          var params = {pointLatLon:pointLatLon,finalConfirmed:finalConfirmed};
          console.log("\nqueryDateSortByDistance params="+util.inspect(params,false,100));
          solrClient.queryDateSortByDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateSortByDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].finalConfirmed == finalConfirmed);
            }
            next();
          });//queryDateSortByDistance
        },

        function(next){
          //DoAssert
          solrClient.close();
          next();
        },
        function(){
          if (next) return next();
        }
    );//handy.pipeline
};//test_client_queryDateSortByDistance_withExistData





function test_queryDateInDistance_withInitData(params,next){
  var solrClient = solr.create({host:host,port:port,commitWithin:commitWithin,threadInterval:threadInterval});
  busInitGeoData({solrClient:solrClient, commitWithin:commitWithin,threadInterval:threadInterval,geoData:geoDateData},function(){
    test_client_queryDateInDistance_withExistData({solrClient:solrClient},next);
  });//busInitGeoData
};//test_queryDateInDistance_withInitData



function test_client_queryDateInDistance_withExistData(params,next){
    var solrClient = params.solrClient;
    if (!solrClient)
      solrClient = solr.create({host:host,port:port,commitWithin:commitWithin,threadInterval:threadInterval});

    var pointLatLon = "39.907366,116.356716";  //Fuxingmen
    var pointLatLon2 = "39.940278,116.355171"; //Xizhimen
    var distance = 4;
    var distanceForAll = 100;
    var start = 0;
    var count = 200;
    var gender = 'male';
    var excludeUserId = "1";
    var dateDateStart = 1352903100784;
    var dateDateEnd = 1360903100784;
    var county = "Xicheng";// "xicheng"; case-sensitive

    var excludeCandidateId = "1";
    var finalConfirmed = false;
    var strFields = "";

    var pageCount = 4;
    var allDocs = null;

    handy.pipeline(
        function(next){
          console.log("\nget all data");
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,start:start,count:count};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            allDocs = solrRetObj.response.docs;
            next();
          });//queryDateInDistance
        },
        function(next){
          console.log("\nget page 1, pageSize="+pageCount);
          var pageIndex = 0;
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,start:pageCount*pageIndex,count:pageCount};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;

            for(var i=0; i<pageCount; i++){
              assert.ok( allDocs[pageCount*pageIndex+i].id == docs[i].id);
            }

            next();
          });//queryDateInDistance
        },
        function(next){
          console.log("\nget page 2, pageSize="+pageCount);
          var pageIndex = 1;
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,start:pageCount*pageIndex,count:pageCount};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;

            for(var i=0; i<pageCount; i++){
              assert.ok( allDocs[pageCount*pageIndex+i].id == docs[i].id);
            }

            next();
          });//queryDateInDistance
        },
        function(next){
          console.log("\nget data in distance "+distance);
          var params = {pointLatLon:pointLatLon,distance:distance,start:start,count:count};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length < allDocs.length);
            next();
          });//queryDateInDistance
        },
        function(next){
          console.log("\nget data at point 2 to check if have cache. it seems NO cache. in distance "+distance);
          var params = {pointLatLon:pointLatLon2,distance:distance,start:start,count:count};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length < allDocs.length);
            next();
          });//queryDateInDistance
        },

        function(next){
          console.log("\nget by gender "+ gender);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,gender:gender};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
            }
            next();
          });//queryDateInDistance
        },

        function(next){
          console.log("\nget by gender and excludeUserId:"+ gender+", "+excludeUserId);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,gender:gender,excludeUserId:excludeUserId};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
              assert.ok( docs[i].userId != excludeUserId);
            }
            next();
          });//queryDateInDistance
        },

        function(next){
          console.log("\nget by gender and excludeUserId and dateDateStart:"+ gender+", "+excludeUserId+", "+dateDateStart);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,gender:gender,excludeUserId:excludeUserId,dateDateStart:dateDateStart};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
              assert.ok( docs[i].userId != excludeUserId);
              assert.ok( docs[i].dateDate - 0 >= dateDateStart);
            }
            next();
          });//queryDateInDistance
        },

        function(next){
          console.log("\nget by gender and excludeUserId and dateDateStart and dateDateEnd:"+ gender+", "+excludeUserId+", "+dateDateStart+", "+dateDateEnd);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,gender:gender,excludeUserId:excludeUserId,dateDateStart:dateDateStart,dateDateEnd:dateDateEnd};
          console.log("queryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
              assert.ok( docs[i].userId != excludeUserId);
              assert.ok( docs[i].dateDate - 0 >= dateDateStart);
              assert.ok( docs[i].dateDate - 0 <= dateDateEnd);
            }
            next();
          });//queryDateInDistance
        },

        function(next){
          console.log("\nget by gender and excludeUserId and dateDateStart and county:"+ gender+", "+excludeUserId+", "+dateDateStart+", "+county);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,gender:gender,excludeUserId:excludeUserId,dateDateStart:dateDateStart, county:county};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
              assert.ok( docs[i].userId != excludeUserId);
              assert.ok( docs[i].dateDate - 0 >= dateDateStart);
            }
            next();
          });//queryDateInDistance
        },

        function(next){
          console.log("\ntry get by empty-to-notExist field");
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,start:start,count:count,excludeCandidateId:excludeCandidateId};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length == allDocs.length);
            next();
          });//queryDateInDistance
        },

        function(next){
          console.log("\nget by finalConfirmed "+ finalConfirmed);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,finalConfirmed:finalConfirmed};
          console.log("\nqueryDateInDistance params="+util.inspect(params,false,100));
          solrClient.queryDateInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryDateInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].finalConfirmed == finalConfirmed);
            }
            next();
          });//queryDateInDistance
        },

        function(next){
          //DoAssert
          solrClient.close();
          next();
        },
        function(){
          if (next) return next();
        }
    );//handy.pipeline
};//test_client_queryDateInDistance_withExistData






function test_queryUserInDistance_withInitData(params,next){
  var solrClient = solr.create({host:host,port:port,commitWithin:commitWithin,threadInterval:threadInterval});
  busInitGeoData({solrClient:solrClient, commitWithin:commitWithin,threadInterval:threadInterval,geoData:geoUserData},function(){
    test_client_queryUserInDistance_withExistData({solrClient:solrClient},next);
  });//busInitGeoData
};//test_queryUserInDistance_withInitData



function test_client_queryUserInDistance_withExistData(params,next){
    var solrClient = params.solrClient;
    if (!solrClient)
      solrClient = solr.create({host:host,port:port,commitWithin:commitWithin,threadInterval:threadInterval});

    var pointLatLon = "39.907366,116.356716";  //Fuxingmen
    var pointLatLon2 = "39.940278,116.355171"; //Xizhimen
    var distance = 4;
    var distanceForAll = 100;
    var start = 0;
    var count = 200;
    var gender = 'male';
    var emailAccount = "15@abc.com";
    var name = "*men";
    var deviceType = gDeviceTypeIphone;

    var heightStart = 1.73;
    var heightEnd = 1.77;
    var county = "Xicheng";// "xicheng"; case-sensitive

    var disabled = false;
    var strFields = "";

    var pageCount = 4;
    var allDocs = null;

    handy.pipeline(
        function(next){
          console.log("\nget all data");
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,start:start,count:count};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            allDocs = solrRetObj.response.docs;
            assert.ok(allDocs.length > 0);
            next();
          });//queryUserInDistance
        },
        function(next){
          console.log("\nget page 1, pageSize="+pageCount);
          var pageIndex = 0;
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,start:pageCount*pageIndex,count:pageCount};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            for(var i=0; i<pageCount; i++){
              assert.ok( allDocs[pageCount*pageIndex+i].id == docs[i].id);
            }

            next();
          });//queryUserInDistance
        },
        function(next){
          console.log("\nget page 2, pageSize="+pageCount);
          var pageIndex = 1;
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,start:pageCount*pageIndex,count:pageCount};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;

            for(var i=0; i<pageCount; i++){
              assert.ok( allDocs[pageCount*pageIndex+i].id == docs[i].id);
            }

            next();
          });//queryUserInDistance
        },
        function(next){
          console.log("\nget data in distance "+distance);
          var params = {pointLatLon:pointLatLon,distance:distance,start:start,count:count};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length < allDocs.length);
            next();
          });//queryUserInDistance
        },
        function(next){
          console.log("\nget data at point 2 to check if have cache. it seems NO cache. in distance "+distance);
          var params = {pointLatLon:pointLatLon2,distance:distance,start:start,count:count};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length < allDocs.length);
            next();
          });//queryUserInDistance
        },

        function(next){
          console.log("\nget by gender "+ gender);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,gender:gender};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
            }
            next();
          });//queryUserInDistance
        },

        function(next){
          console.log("\nget by gender and name:"+ gender+", "+name);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,gender:gender,name:name};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);

            }
            next();
          });//queryUserInDistance
        },

        function(next){
          console.log("\nget by heightStart:"+ heightStart);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,heightStart:heightStart};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].height - 0 >= heightStart);
            }
            next();
          });//queryUserInDistance
        },

        function(next){
          console.log("\nget by heightStart and heightEnd:"+ heightStart+", "+heightEnd);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,heightStart:heightStart,heightEnd:heightEnd};
          console.log("queryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].height - 0 >= heightStart);
              assert.ok( docs[i].height - 0 <= heightEnd);
            }
            next();
          });//queryUserInDistance
        },

        function(next){
          console.log("\nget by gender and heightStart and county:"+ gender+", "+heightStart+", "+county);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,gender:gender,heightStart:heightStart, county:county};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].gender == gender);
              assert.ok( docs[i].height - 0 >= heightStart);
              assert.ok( docs[i].county == county);
            }
            next();
          });//queryUserInDistance
        },

        function(next){
          console.log("\nget by disabled "+ disabled);
          var params = {pointLatLon:pointLatLon,distance:distanceForAll,disabled:disabled};
          console.log("\nqueryUserInDistance params="+util.inspect(params,false,100));
          solrClient.queryUserInDistance(params,function(err,solrRetObj){
            if (err){
              console.log("queryUserInDistance err="+util.inspect(err,false,100));
            }else{
              console.log("solrRetObj="+util.inspect(solrRetObj,false,100));
            }
            var docs = solrRetObj.response.docs;
            assert.ok(docs.length > 0);
            for(var i=0; i<docs.length; i++){
              assert.ok( docs[i].disabled == disabled);
            }
            next();
          });//queryUserInDistance
        },

        function(next){
          //DoAssert
          solrClient.close();
          next();
        },
        function(){
          if (next) return next();
        }
    );//handy.pipeline
};//test_client_queryUserInDistance_withExistData











//test_deleteAll_setArray_getCount_1();
//test_deleteAll_setArray_getCount_2();
//test_solrThread();

//test_queryDateSortByDistance_withInitData();
//test_client_queryDateSortByDistance_withExistData({});

//test_queryDateInDistance_withInitData();
//test_client_queryDateInDistance_withExistData({});

test_queryUserInDistance_withInitData();
//test_client_queryUserInDistance_withExistData({});













