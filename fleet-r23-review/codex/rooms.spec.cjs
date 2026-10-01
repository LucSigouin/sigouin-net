const {test,expect}=require('../../Sigouin-Hub/node_modules/@playwright/test');const fs=require('node:fs');
test('all deployed interiors and cards',async({page})=>{
 const errors=[],rooms=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.goto('https://sigouin.net/hub/');await page.waitForFunction(()=>window.__hub?.state()==='play');
 for(const id of ['computer-lab','music-studio','office','ai-workspace']){
 expect(await page.evaluate(id=>window.__hub.teleport(id),id)).toBe(true);await page.waitForFunction(id=>window.__hub.nearest()===id,id);await page.keyboard.press('e');await page.waitForFunction(id=>window.__hub.level()===id&&window.__hub.state()==='play',id);
 const exhibits=(await page.evaluate(()=>window.__hub.interactables())).filter(x=>x.kind==='exhibit');
 for(const ex of exhibits){await page.evaluate(id=>window.__hub.teleport(id),ex.id);await page.waitForFunction(id=>window.__hub.nearest()===id,ex.id);await page.keyboard.press('e');await expect(page.locator('.card-backdrop')).toBeVisible();await expect(page.locator('.card h2')).toHaveText(ex.label);await page.keyboard.press('Escape');await expect(page.locator('.card-backdrop')).toBeHidden();}
 rooms.push({id,exhibits});await page.screenshot({path:__dirname+'/room-'+id+'.png'});await page.evaluate(id=>window.__hub.teleport(id+':exit'),id);await page.waitForFunction(id=>window.__hub.nearest()===id+':exit',id);await page.keyboard.press('e');await page.waitForFunction(()=>window.__hub.level()==='courtyard'&&window.__hub.state()==='play');
 }
 fs.writeFileSync(__dirname+'/rooms.json',JSON.stringify({rooms,errors},null,2));expect(errors).toEqual([]);
});
