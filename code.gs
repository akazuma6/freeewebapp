// @ts-nocheck

/**
 * ページを開いた時に最初に呼ばれるルートメソッド
 */
function doGet(e) {
  var empId = e.parameter.empId
  
  var password = (e.parameter.password !== undefined) ? e.parameter.password : undefined;

  console.log("ID,PASS表示", empId, password)
  if (!empId) {
    return HtmlService.createTemplateFromFile("view_home")
      .evaluate().setTitle("Home");
  }
  if (password == undefined){
    var template = HtmlService.createTemplateFromFile("view_password");
    template.empId = empId;
    template.errorMessage = null; 
    return template.evaluate().setTitle("Password Required");
  }

  if(passChecker(empId, password)){ //passwordが認証された場合のみIDをPropertyに保
    PropertiesService.getUserProperties().setProperty('empId', empId.toString())
    return HtmlService.createTemplateFromFile("view_detail")
      .evaluate().setTitle("Detail: " + empId.toString())
  }else{
    var template = HtmlService.createTemplateFromFile("view_password");
    template.empId = empId;

    template.errorMessage = "パスワードが間違っています";
    return template.evaluate().setTitle("Password Required");


  }
}

function passChecker(empId, password){
  try{
    if(last_row < 2){  //名簿にデータがないため失敗
    return false;
    }
    var empData = empSheet.getRange(2, 1, last_row - 1, 3).getValues();
    for (var i = 0; i < empData.length; i++){
      if (empData[i][0] == empId){
        var correctPassword = empData[i][2];
        return password == correctPassword;//パスワードがあっているかどうかをtrueかfalseで返す
      }
    }
    return false;
  }catch (e){
    console.error("passCheckerでエラーが発生" + e.toString())
    return false;

  }
}



/**
 * このアプリのURLを返す
 */
function getAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * 従業員一覧
 */
  var empSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[1]// 「従業員名簿」のシート
  var last_row = empSheet.getLastRow()
  var empRange = empSheet.getRange(2, 1, last_row, 2);// シートの中のヘッダーを除く範囲を取得
function getEmployees() {


  var timeClocksSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[2]// 「打刻履歴」のシート
  var readRow = timeClocksSheet.getLastRow() 
  //console.log('勤怠の時間何行か', readRow);
  var exams = timeClocksSheet.getRange(2, 1, readRow -1, 2).getValues()
    //console.log(exams);
  var revExams = exams.slice().reverse()
  //console.log(revExams);
  var employees = [];

  var i = 1;
  while (true) {
    var empId =empRange.getCell(i, 1).getValue();
    var empName =empRange.getCell(i, 2).getValue();

    
    
    if (empId === ""){ //　値を取得できなくなったら終了
      break;
    }

    const firstElementI = revExams.find(element => element[0] === i);
    console.log(firstElementI);
    if(firstElementI[1] == '退勤'){
      var status = 0;
    }else{
      var status = 1;
    };
    console.log(status);
    

    employees.push({
      'id': empId,
      'name': empName,
      'attend':status
    })
    i++
  }
  console.log(employees);
  return employees

}


/**
 * 従業員情報の取得
 * ※ デバッグするときにはempIdを存在するIDで書き換えてください
 */
function getEmployeeName() {
  var empId =PropertiesService.getUserProperties().getProperty('empId') // ※デバッグするにはこの変数を直接書き換える必要があります
  var empSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[1]// 「従業員名簿」のシート
  var last_row = empSheet.getLastRow()
  var empRange = empSheet.getRange(2, 1, last_row, 2);// シートの中のヘッダーを除く範囲を取得
  var i = 1;
  var empName = ""
  while (true) {
    var id =empRange.getCell(i, 1).getValue();
    var name =empRange.getCell(i, 2).getValue();
    if (id === ""){ 
      break;
    }
    if(id == empId){
      empName = name
    }
    i++
  }

  return empName
}

function restRecommend(){      //作った関数
  var timeClocksSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[2]// 「打刻履歴」のシート
  var last_row = timeClocksSheet.getLastRow()
  var arr = timeClocksSheet.getRange(2,1,last_row -1,3).getValues();
  var revArr = arr.slice().reverse();
  //console.log(revArr);
  
  var restMana = [];
  var i = 1;
  while (true) {
    var empId =empRange.getCell(i, 1).getValue();


    if (empId === ""){ //　値を取得できなくなったら終了
      break;
    }
    
    const found = revArr.find(element => element[0] == empId);
    var attendTime = 0;
    //console.log("foundの中身",found)
    if(found[1] == '出勤'){
      attendTime = found[2]
      
    }else if(found[1] == '休憩終了'){
      attendTime = found[2]
    }else{
      attendTime = new Date();
    }
    //console.log(attendTime);
    var startDate = new Date();
    var endDate = new Date(attendTime);
    //console.log(date);
    const timeDifferenceMilliseconds =  startDate.getTime()- endDate.getTime();

    // ミリ秒を時間に変換
    const hours = Math.floor(timeDifferenceMilliseconds / (1000 * 60 * 60));
    //console.log(empId,'連続勤務時間' ,hours);


    restMana.push({
      'id': empId,
      'liveTime': hours

    })
    i++
  }
  console.log(restMana);
  return restMana;
}
/**
 * 勤怠情報の取得
 * 今月における今日までの勤怠情報が取得される
 */

//以下の関数を、セルごとに種別、日時を読み込むのではなくgetValuesで二次元配列を取得してそれらを操作するようにコードの簡略化をした
function getTimeClocks() {
  var empId =PropertiesService.getUserProperties().getProperty('empId') // ※デバッグするにはこの変数を直接書き換える必要があります
  var timeClocksSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[2]// 「打刻履歴」のシート
  var last_row = timeClocksSheet.getLastRow()
  var empTimeClocks = [];
  if (last_row > 1) {
    // 2行目から最終行までの3列分のデータを二次元配列として取得
    var allData = timeClocksSheet.getRange(2, 1, last_row - 1, 3).getValues();

    // 取得した全データ（配列）をループ処理
    for (var i = 0; i < allData.length; i++) {
      var row = allData[i];
      var rowEmpId = row[0]; // 0番目の要素が従業員ID
      var type = row[1];     // 1番目の要素が種別
      var datetime = row[2]; // 2番目の要素が日時

      // 従業員IDが選択中のIDと一致する場合のみ、結果の配列に追加
      if (rowEmpId.toString() == empId) {
        empTimeClocks.push({
          'date': Utilities.formatDate(new Date(datetime), "Asia/Tokyo", "yyyy-MM-dd HH:mm"),
          'type': type
        });
      }
    }
  }
  console.log(empTimeClocks);
  return empTimeClocks
}

/**
 * 勤怠情報登録
 */
function saveWorkRecord(form) {
  var empId = PropertiesService.getUserProperties().getProperty('empId') // ※デバッグするにはこの変数を直接書き換える必要があります
  // inputタグのnameで取得
  var targetDate = form.target_date
  var targetTime = form.target_time
  var targetType = ''
  switch (form.target_type) {
    case 'clock_in':
      targetType = '出勤'
      break
    case 'break_begin':
      targetType = '休憩開始'
      break
    case 'break_end':
      targetType = '休憩終了'
      break
    case 'clock_out':
      targetType = '退勤'
      break;
  }
  var timeClocksSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[2]// 「打刻履歴」のシート
  var targetRow = timeClocksSheet.getLastRow() + 1
  var now = new Date();
  var formattedDate = Utilities.formatDate(now, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
  timeClocksSheet.getRange(targetRow, 1).setValue(empId)
  timeClocksSheet.getRange(targetRow, 2).setValue(targetType)
  timeClocksSheet.getRange(targetRow, 3).setValue(formattedDate)
  return '登録しました'
}
  var memberSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[1]
function saveRoleRecord(form) {
  var empId = PropertiesService.getUserProperties().getProperty('empId') // ※デバッグするにはこの変数を直接書き換える必要があります
  // inputタグのnameで取得
  var targetRole = form.role_type
  var targetTypeRole = 'yaa'
  switch (form.role_type) {
    case 'hall':
      targetTypeRole = 'ホール'
      break
    case 'kitchen':
      targetTypeRole = 'キッチン'
      break
    case 'non':
      targetTypeRole = ' '
      break

  }

// 「打刻履歴」のシート
  memberSheet.getRange(empId + 1 - 9, 4).setValue(targetTypeRole);
  return '登録しました'
}


function getRole (){
  var id_role =[];
  var row = memberSheet.getLastRow()
  var arrays = memberSheet.getRange(2, 1, row -1, 4).getValues();
  var j = 0;
  console.log('arraysの中身',arrays);
  for(j;j<row -1;j++){
    id_role.push(
      arrays[j][3]
    )

    
  }
  console.log('id_roleの中身',id_role);
  return id_role;

}

/**
 * 選択している従業員のメモカラムの値をspread sheetから取得する
 */
//getValuesに修正
function getEmpMemo() {
  var selEmpId = PropertiesService.getUserProperties().getProperty('empId') // ※デバッグするにはこの変数を直接書き換える必要があります
  var checkSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]// 「チェック結果」のシート
  var last_row = checkSheet.getLastRow()
  var empId_memo = checkSheet.getRange(2, 1, last_row, 2).getValues();// シートの中のヘッダーを除く範囲を取得
  var checkResult = "";
  var i = 1;
  while (true) {
    var empId =empId_memo[i - 1][0];
    var result =empId_memo[i - 1][1];
    if (empId === ""){ //　値を取得できなくなったら終了
      break;
    }
    if (empId == selEmpId){
        checkResult = result
        break;
    }
    i++
  }
  console.log(checkResult);
  return checkResult
}

/**
 * メモの内容をSpreadSheetに保存する
 */
function saveMemo(form) {
  var empId = PropertiesService.getUserProperties().getProperty('empId') // ※デバッグするにはこの変数を直接書き換える必要があります
  // inputタグのnameで取得
  var memo = form.memo

  var targetRowNumber = getTargetEmpRowNumber(empId)
  var sheet = SpreadsheetApp.getActiveSheet()
  if (targetRowNumber == null) {
    // targetRowNumberがない場合には新規に行を追加する
    // 現在の最終行に+1した行番号
    targetRowNumber = sheet.getLastRow() + 1
    // 1列目にempIdをセットして保存
    sheet.getRange(targetRowNumber, 1).setValue(empId)
  }
  // memoの内容を保存
  var values = sheet.getRange(targetRowNumber, 2).setValue(memo)

}

/**
 * spreadSheetに保存されている指定のemployee_idの行番号を返す
 */
function getTargetEmpRowNumber(empId) {
  // 開いているシートを取得
  var sheet = SpreadsheetApp.getActiveSheet()
  // 最終行取得
  var last_row = sheet.getLastRow()
  // 2行目から最終行までの1列目(emp_id)の範囲を取得
  var data_range = sheet.getRange(1, 1, last_row, 1);
  // 該当範囲のデータを取得
  var sheetRows = data_range.getValues();
  // ループ内で検索
  for (var i = 0; i <= sheetRows.length - 1; i++) {
    var row = sheetRows[i]
    if (row[0] == empId) {
      // spread sheetの行番号は1から始まるが配列のindexは0から始まるため + 1して行番号を返す
      return i + 1;
    }
  }
  // 見つからない場合にはnullを返す
  return null
}


function getRolle(formObject) {
  var empId = PropertiesService.getUserProperties().getProperty('empId') // ※デバッグするにはこの変数を直接書き換える必要があります
  // inputタグのnameで取得
//  var targetDate = form.target_date
//  var targetTime = form.target_time
  

  var empId_rolle =[]

}
  
function textImport(){

  const text = "2025/08/05 15:00:00,2025/08/05 20:00:00"
  const array = text.split(',');
  console.log(array);


  var row = reqSheet.getLastRow();
  var now = new Date();
  reqSheet.getRange(row + 1, 1, 1, 2).setValue(array);

}
function doPost(e){
  var reqSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[3];
  
  // LINEから来た JSON文字列 を JavaScriptのオブジェクトに変換
  let data = JSON.parse(e.postData.contents);
  var textData = data.events[0].message.text;
  const shihtArray = textData.split(',');
  
  reqSheet.appendRow([new Date(), shiftArray[0], shiftArray[1]]);
  //return shiftArray;
}
function getShft(){
    var reqSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[3];
    var row = reqSheet.getLastRow();
    var shiftData = reqSheet.getRange(2, 2, row, 2).getValues();
    var array = [];
    for(var i = 0; i < row - 1; i ++){
      if(shiftData[i][0] != null && shiftData[i][0] != ""){
      array.push([shiftData[i]])
      }

    }

  console.log('getShiftのarrayの中身', array);
  return array;
}
