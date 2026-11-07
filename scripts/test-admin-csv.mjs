import test from "node:test";
import assert from "node:assert/strict";
import {csvCell,makeCsv} from "../concepts/premium-v2/admin/dashboard/csv-export.js";
test("CSV quotes, separators and newlines remain escaped",()=>{
 assert.equal(csvCell('BOX;"Test"'),'"BOX;""Test"""');
 const csv=makeCsv(["Kennung","Name"],[["BOX-001",'Foto;"Premium"']]);
 assert.ok(csv.startsWith("\uFEFF"));
 assert.match(csv,/"Foto;""Premium"""/);
 assert.match(csv,/\r\n$/);
});
test("spreadsheet formula injection is neutralized",()=>{
 for(const value of ['=HYPERLINK("bad")','+SUM(1,2)','-cmd','@SUM(1,2)','  =1+1']){
  assert.ok(csvCell(value).startsWith('"\''),"Not escaped: "+value);
 }
 assert.equal(csvCell("Fotobox Premium"),'"Fotobox Premium"');
});
test("no malformed columns in report export",()=>{
 assert.throws(()=>makeCsv(["id","name"],[["only one"]]));
});
