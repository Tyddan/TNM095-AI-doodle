

function createPie(dataElement, pieElement) {
  var listData = [];
  $(dataElement+" span").each(function() {
    listData.push(Number($(this).html()));
  });
  var listTotal = 0;
  for(i=0; i<listData.length; i++) {
    listTotal += listData[i];
  }
  
}
