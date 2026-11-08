// FOTOPOLIS Studio 4.0 – local-only CSV reports, no server export endpoint.
export function csvCell(value){
 const plain=String(value??"");
 const neutralized=/^[\s]*[=+@-]/.test(plain)?"'"+plain:plain;
 return '"'+neutralized.replaceAll('"','""')+'"';
}
export function makeCsv(headers,rows){
 if(!Array.isArray(headers)||!Array.isArray(rows))throw Error("Expected tabular data");
 const lines=[headers,...rows].map(row=>{
   if(!Array.isArray(row)||row.length!==headers.length)throw Error("Invalid report row");
   return row.map(csvCell).join(";");
 });
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
export function downloadCsv(name,headers,rows){
 const content=makeCsv(headers,rows);
 const url=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download=name;
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
