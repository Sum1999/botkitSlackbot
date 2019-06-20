/*
Left test cases i)till the end of... ii) rest of the/this ...
*/ 
const request = require("request");
var originalMsg;
var duramt;
var durunit;
var usersLists=[];//Caching the list of users
var imList=[];//Caching list of DM users
var datavalid=true;
listOfUsers();
listOfDMS();
var category; // store category of the message
var category1; //stores category of part 2 if msg needs to be split
console.log("In skills");

module.exports = function(controller,dialogflowMiddleware) {
    
    controller.hears(['Default Welcome Intent'], 'direct_mention,'+
    'direct_message', dialogflowMiddleware.hears , function(bot, message) {
        console.log(message);
      
        if(message.event!==undefined && 
          (message.event.channel==='CK1G9CP5E' || checkUserDMChannel(message.event.channel)))
           { replyText = message.fulfillment.text;//get text to reply back
            // 
            bot.reply(message,replyText);
           }
    });
    //For msgs which do not specify dates in correct format
    controller.hears(['Number Date intent'],'direct_message,direct_mention,'
    +'ambient', dialogflowMiddleware.hears,function(bot,message)
    {
      let params=message.nlpResponse.queryResult.parameters;
        if(message.event!==undefined && 
          (message.event.channel==='CK1G9CP5E' || checkUserDMChannel(message.event.channel) ))
        {
            category=params.fields.message.stringValue;
            console.log(category);
            originalMsg=message;
            replyText = message.fulfillment.text;// get text to reply with
            bot.reply(message,'<@'+message.event.user+'>Please check your DM.');
            //Reply personally for further information
            bot.startPrivateConversation({user:message.event.user},(err,convo)=>{
              convo.say(replyText);
            });
        }
    });
    //for team msgs that need not be stored
    controller.hears(['not useful intent'],'direct_message,direct_mention,'
    +'ambient', dialogflowMiddleware.hears,function(bot,message)
    {
      let params=message.nlpResponse.queryResult.parameters;
        if(message.event!==undefined && 
          (message.event.channel==='CK1G9CP5E' || checkUserDMChannel(message.event.channel) ))
        {
            console.log("No use");
        }
    });
    //for msgs which specify the duration and not the dates
    controller.hears(['Duration'],'direct_message,direct_mention,'
    +'ambient', dialogflowMiddleware.hears,function(bot,message)
    {
       //console.log(message);
       //console.log(imList.length);
       let params=message.nlpResponse.queryResult.parameters;
        //console.log(duramt+" "+durunit);
        if(message.event!==undefined && 
          (message.event.channel==='CK1G9CP5E' || checkUserDMChannel(message.event.channel) ))
        {
            if(params.fields.duration!==undefined && params.fields.duration.stringValue!=='')
            {
              duramt=params.fields.duration.structValue.fields.amount.numberValue;
              durunit=params.fields.duration.structValue.fields.unit.stringValue;
              category=params.fields.message.stringValue;
            }
            originalMsg=message;
            replyText = message.fulfillment.text;// get text to reply with
            bot.reply(message,'<@'+message.event.user+'>'+replyText);
            //Reply personally for further information
            bot.startPrivateConversation({user:message.event.user},(err,convo)=>{
              convo.say('Mention the starting date and ending date of absence from office');
            });
        }
  });
  //for msgs which specify dates and category
  controller.hears([['message intent'],['Day & Date intent']],'direct_message,direct_mention,'
  +'ambient', dialogflowMiddleware.hears,function(bot,message) 
  {
      let params=message.nlpResponse.queryResult.parameters;
  
      if(message.event!==undefined &&
         (message.event.channel==='CK1G9CP5E' || checkUserDMChannel(message.event.channel)))
      {
        if(params.fields.duration!==undefined && params.fields.duration.stringValue!=='')
        {
          duramt=params.fields.duration.structValue.fields.amount.numberValue;
          durunit=params.fields.duration.structValue.fields.unit.stringValue;
          
        }
         replyText = message.fulfillment.text; //get fulfillment text
         //console.log(message.event.text);   
         if(originalMsg!==undefined)
           {
              if(retrieveUserInfoFromMessage(params,originalMsg))
                bot.reply(message, replyText);
              else if(datavalid===false)
              {
                bot.reply(message, 'Please enter correct dates.');
              }
              else
                bot.reply(message, 'Multiple users with the same name ! Please enter the entire message'+
                 'with the name and surname of user');
           }
           else
           {
              let part1;
              let part2;
              if(params.fields.message1!==undefined && params.fields.message1.stringValue!=='')
              {
                let substringIndex=message.event.text.toUpperCase().indexOf(params.fields.message1.stringValue.toUpperCase());
                 part1=message.event.text.slice(0,substringIndex);
                 console.log(substringIndex);
                 if(part1.lastIndexOf('and')===part1.length-4)
                 {
                    part1=part1.slice(0,part1.lastIndexOf('and'));
                 }
                 part2=message.event.text.slice(substringIndex,message.event.text.length);
                 console.log("PART1:"+part1);
                 console.log("PART2:"+part2);
                if(retrieveUserInfoFromMessage(params,message,part1,part2))
                  bot.reply(message, replyText);
              }
          
              else if(retrieveUserInfoFromMessage(params,message))
                bot.reply(message, replyText);
              else if(datavalid===false)
              {
                bot.reply(message, 'Please enter correct dates.');
              }  
              else
                {
                  console.log("hey!wrong ans!!");
                  bot.reply(message, 'Multiple users with the same name ! Please enter the entire message'+
                  'with the name and surname of user');
                }
           }
      }
  });//end of callback function of controller.hears() function
  
};//End of module.exports funtion

//It caches the entire list of users which are the part
//of the current workspace in the array of objects usersLists
function listOfUsers() {
    request.get('https://slack.com/api/users.list?token='+
        process.env.Apptoken+'&pretty=1',function (err,requ,response)
    {
    var data= JSON.parse(response);
    usersLists=data.members;
   });//end of get users.list function
};
// Caching all the DM channels in the workspace
function listOfDMS() {
  request.get('https://slack.com/api/im.list?token'+
  '='+process.env.Apptoken+'&pretty=1',function (err,requ,response)
  {
  var data= JSON.parse(response);
  imList=data.ims;
 });//end of get im.list function
};
//Check if the DM channel matches to existing dm channels
function checkUserDMChannel(userid)
{
  for(let dm of imList)
  {
    if(dm.id===userid)
    {
      return true;
    }
  }
  return false;
}
//Function to retrieve user info and dates from the message returns false if there are 
//multiple users of the same First name as mentioned in the message
function retrieveUserInfoFromMessage(params,message,part1=undefined,part2=undefined)
{
    if(params.fields.message && !category)
     category=params.fields.message.stringValue;
    if(params.fields.message1 && !category1)
     category1=params.fields.message1.stringValue;
  console.log("Category:"+category+" Category1:"+category1);
    var today=new Date();
    var time=today.getHours()+":"+today.getMinutes()+":"+today.getSeconds();
    if (message.event.user !== undefined) //Message is recorded into the google sheet
    {
          var  userid=message.event.user;
          var replaceid;
          let msg=message.event.text.toLowerCase();
          if(message.event.text.includes('<@'))//if message has mentioned another slack user
          {
              var msgSplit=message.event.text.split(" ");
              for(let m of msgSplit)
              {
                  if(m.includes('<@'))//Retreive that users id for further use
                  {
                    replaceid=m;
                    userid=m.substr(2,9);
                  }
              }
          } 
          var dp=getDateFromDatePeriod(params.fields['date-period'],time);//get dates from date-period
          var d=getDatesFromDateParameter(params.fields.date,time);//get dates from date parameter
          var dp1,startDate1,endDate1,d1;
          var date1;                 
          var ed1,ed2;               
          var tempdate;
          var startDate=dp.startDate;
          var endDate=dp.endDate;
          var date=d.startDate;
          ed1=d.endDate;
         //Get all dates available if there are two message parameters   
         if(params.fields.message1!==undefined && params.fields.message1.stringValue!=='')
         {
          dp1=getDateFromDatePeriod(params.fields['date-period1'],time);
          d1=getDatesFromDateParameter(params.fields.date1,time);
          startDate1=dp1.startDate;
          endDate1=dp1.endDate;
          date1=d1.startDate;
          ed2=d1.endDate;
         }
         //get emddate for rest of the week... or till end of the week...
         if(message.event.text.includes("rest of the week") || 
             message.event.text.toLowerCase().includes("till the end of the week") ||
             message.event.text.toLowerCase().includes("till the end of this week") ||
             message.event.text.toLowerCase().includes("till end of week")
             || message.event.text.toLowerCase().includes("till end of the week"))
        {
          var d= today.getDay();
          let edate= new Date(today.getFullYear(),
                               today.getMonth(), today.getDate() + (d == 0?0:7)-d );                                   
          let year=edate.getFullYear();
          let day=String(edate.getDate()).padStart(2,'0');
          let month= String(edate.getMonth() + 1).padStart(2,'0'); //January is 0!
          tempdate=month+"-"+day+"-"+year;
          ed1=tempdate+" "+time;
        }
        //get enddate for rest of the month... or till end of the month...
        if(message.event.text.includes("rest of the month") || 
            message.event.text.toLowerCase().includes("till the end of the month") ||
            message.event.text.toLowerCase().includes("till the end of this month")
            || message.event.text.toLowerCase().includes("till end of month")
            || message.event.text.toLowerCase().includes("till end of this month")
            || message.event.text.toLowerCase().includes("till end of the month") )
        {
          var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0,
                                  today.getHours(),today.getMinutes(),today.getSeconds());
          let year=lastDay.getFullYear();
          let day=String(lastDay.getDate()).padStart(2,'0');
          let month= String(lastDay.getMonth() + 1).padStart(2,'0'); //January is 0!
          tempdate=month+"-"+day+"-"+year;
          ed1=tempdate+" "+time;
        } 
        //get startdate if it contains rest of this... or till the end of this...  
        if(message.event.text.includes("rest of this") || message.event.text.includes("till end of this")
            || message.event.text.includes("till the end of this"))
        {
           if(date)//if date available
             startDate=date;
           else if(date1)  // if it is in part two
             startDate=date1;
           else
           {              
              let year=today.getFullYear();
              let day=String(today.getDate()).padStart(2,'0');
              let month= String(today.getMonth() + 1).padStart(2,'0'); //January is 0!
              tempdate=month+"-"+day+"-"+year;
              startDate=tempdate+" "+time;
            }
              
        }    
        //Check if entered dates are valid or not.If valid then only, insert into sheet
        if (dateValidation(startDate,endDate,date,ed1,duramt,durunit) || dateValidation(startDate1,endDate1,date1,ed2))
        {
          let flag1=false;   
          let flag2=false;
          let realname;
          let count=0;
          //Check if username is specified in the message
          for(let u of usersLists)
          {
              if(u.real_name!==undefined) 
              {
                  if(msg.includes(u.real_name.toLowerCase()))
                  {
                    //if 2 msg entities
                    if(params.fields.message1!==undefined && params.fields.message1.stringValue!=='')
                    {
                      insert_in_excel(u.real_name,part1,category,startDate,endDate,date,ed1);
                      insert_in_excel(u.real_name,part2,category1,startDate1,endDate1,date1,ed2);
                      flag1=true;
                      break;
                    }
                    //else
                      insert_in_excel(u.real_name,message.event.text,category,startDate,endDate,date,ed1);
                      flag1=true;
                      break;
                  }
                  //if only first name mentioned
                  if(u.profile.first_name!==undefined) 
                  {
                      if(msg.includes(u.profile.first_name.toLowerCase()))
                      {
                        flag2=true;
                        realname =u.real_name;
                        count++;
                      }
                  }
              }
          }//Only first name mentioned but only 1 user with that name
          if((flag1!==true && flag2===true) && count==1)
          {
            //if 2 msg entities
            if(params.fields.message1!==undefined && params.fields.message1.stringValue!=='')
            {
              insert_in_excel(u.real_name,part1,category,startDate,endDate,date,ed1);
              insert_in_excel(u.real_name,part2,category1,startDate1,endDate1,date1,ed2);
            }
            else
            insert_in_excel(realname,message.event.text,category,startDate,endDate,date,ed1);
          }
          else if(flag2===true && count>1) //Error coz clash of first names
          {
            return false;
          }
          else if(flag1===false) //User name not mentioned in message
          {
              for(let u of usersLists)
              {
                  if(u.id===userid)
                  {
                     if(replaceid!==undefined)//@username is replaced by the username
                      {
                        let replacedText=message.event.text.replace(replaceid,u.real_name);
                        if(params.fields.message1!==undefined && params.fields.message1.stringValue!=='')
                        {
                          insert_in_excel(u.real_name,part1.replace(replaceid,u.real_name),category,
                                          startDate,endDate,date,ed1);
                          insert_in_excel(u.real_name,part2.replace(replaceid,u.real_name),category1,
                                          startDate1,endDate1,date1,ed2);
                          break;
                        }
                        else
                        {
                          insert_in_excel(u.real_name,replacedText,category,startDate,endDate,date,ed1);
                          break;
                        }
                      }
                      //if 2 msg entities
                      if(params.fields.message1!==undefined && params.fields.message1.stringValue!=='')
                        {
                          insert_in_excel(u.real_name,part1,category,startDate,endDate,date,ed1);
                          insert_in_excel(u.real_name,part2,category1,startDate1,endDate1,date1,ed2);
                          break;
                        }
                      else 
                      {  
                        insert_in_excel(u.real_name,message.event.text,category,startDate,endDate,date,ed1);
                        break;
                      }
                  }
              }
          }
        }
        else //Cannot be inserted cause of name clash
        {
          return false;
        }
    }
  duramt=undefined;
  durunit=undefined;
  category=undefined;
  category1=undefined;
  originalMsg=undefined;
  return true;//Insertion success
};

//Function inserts the Name, the entire message and the Dates mentioned in the message
function insert_in_excel(name, msg,category,startDate,endDate,date,date1) 
{
  console.log(name+ " "+msg+" "+category+" "+startDate+" "+endDate+" "+date+" "+date1);
  if(msg.includes('&amp;'))//@username ..... type of message
  {
   msg=msg.replace(/&amp;/g,'%26');
  }
  if(category)
  {
    request.post(process.env.googleScriptUrl+"?&Name=" + name + "&Message="+msg+"&Category="
    +category+"&startDate="+startDate+"&endDate="+endDate +"&date="+date +
    "&date1="+date1+"&action=insert", function (err, requ, resp)
   {
      if (err) console.log(err);
      return;
  });
  }
};
//Check if given dates are valid or not
function dateValidation(startDate,endDate,date,date1,duramt,durunit)
{
  console.log(startDate+" "+endDate+" "+date+" "+date1+" "+duramt+" "+durunit);
  if(startDate)
  var st=new Date(startDate.split(" ")[0]);
  if(endDate)
  var ed=new Date(endDate.split(" ")[0]);
  if(date)
  var d=new Date(date.split(" ")[0]);
  if(date1)
  var d1=new Date(date1.split(" ")[0]);
  if(startDate && endDate) //date-period mentioned
  {
    const no=difbetweenDates(st,ed)+1;
    if(no<0)
    {
      datavalid=false;
      return false;
    }
    if(duramt)
    {
      if(durunit==='day' && duramt===no)
        return true;
      if(durunit==='wk' && no===duramt*7)
        return true;  
      if(durunit==='mo' && no===duramt*31)
        return true;
      if(durunit==='mo' && no!==duramt*30)
        return true;
      if(durunit==='yr' && no!==duramt*365)
        return true;  
      datavalid=false;
      return false;
    }
  }
  if(date && date1) //2 dates specified
  {
    const no=difbetweenDates(d,d1)+1;
    //console.log(no);
    if(no<0)
    {
      datavalid=false;
      return false;
    }
    if(duramt)
    {
      if(durunit==='day' && duramt===no)
        return true;
      if(durunit==='wk' && no===duramt*7)
        return true;  
      if(durunit==='mo' && no===duramt*31)
        return true;
      if(durunit==='mo' && no!==duramt*30)
        return true;
      if(durunit==='yr' && no!==duramt*365)
        return true;  
      datavalid=false;
      return false;  
      }
  }
  //only one date iven for duration intent
  if((date && duramt) && (date1===undefined && startDate===undefined && endDate===undefined) )
  {
    datavalid=false;
    return false;  
  }
  else 
  {
    datavalid=true;
    return true;
  }
}
//Calculate difference between dates(duration in no of days)
function difbetweenDates(st,ed)
{
  const utc1=Date.UTC(st.getFullYear(),st.getMonth(),st.getDate());
  const utc2=Date.UTC(ed.getFullYear(),ed.getMonth(),ed.getDate());

  return Math.floor((utc2-utc1)/(1000*3600*24));
}
function getDateFromDatePeriod(dateperiod,time)
{
  if(dateperiod && dateperiod.structValue)
  {
    let startdate;
    let enddate;
    let startDate1=dateperiod.structValue.fields.startDate.stringValue;
    if(startDate1){
      let dt=startDate1.split('T');
      startdate=dt[0]+' '+time;
    }
    let endDate1=dateperiod.structValue.fields.endDate.stringValue;
    if(endDate1){
      let dt=endDate1.split('T');
      enddate=dt[0]+' '+time;
    }
   return( { "startDate" : startdate,
             "endDate": enddate  
            });
  }
  else
      return( { "startDate" : undefined,
                "endDate" : undefined
              });
}
function getDatesFromDateParameter(dat,time)
{
  let startdate;
  let enddate;
  if(dat && dat.listValue.values[0])
  {
    if(dat.listValue.values[0]!==undefined )
    {
      let dat1=dat.listValue.values[0].stringValue;
      if(dat1!==undefined){
        let dt=dat1.split('T');
        startdate=dt[0]+' '+time;
      }
      if(dat.listValue.values.length>1)  
      {
        let dat2=dat.listValue.values[dat.listValue.values.length-1].stringValue;
        if(dat2!==undefined){
          let dt=dat2.split('T');
          enddate=dt[0]+' '+time;
        }
      }
      return( { "startDate" : startdate,
             "endDate": enddate  
            });
    }
  }
  else
  {
    return( { "startDate" : undefined,
             "endDate": undefined  
            });
  }
}