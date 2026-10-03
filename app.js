const KEY="my-budget-v1";
const defaultData={transactions:[],budgets:[],goals:[],bills:[]};
let data=JSON.parse(localStorage.getItem(KEY)||"null")||defaultData;

const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function id(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function fmtDate(d){return new Date(d).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}
function totals(){let income=data.transactions.filter(x=>x.type==="income").reduce((a,x)=>a+Number(x.amount),0);let spent=data.transactions.filter(x=>x.type==="expense").reduce((a,x)=>a+Number(x.amount),0);return{income,spent,balance:income-spent}}
function empty(text){return `<div class="empty">${text}</div>`}

function render(){
 const t=totals();
 $("balance").textContent=money(t.balance);$("income").textContent=money(t.income);$("spent").textContent=money(t.spent);
 renderTransactions();renderBudgets();renderGoals();renderBills();
 $("homeTransactions").innerHTML=data.transactions.length?data.transactions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).map(transactionHTML).join(""):empty("No transactions yet");
 $("homeBills").innerHTML=data.bills.length?data.bills.slice().sort((a,b)=>new Date(a.due)-new Date(b.due)).slice(0,3).map(billHTML).join(""):empty("No bills added yet");
 $("homeGoals").innerHTML=data.goals.length?data.goals.slice(0,3).map(goalHTML).join(""):empty("No savings goals yet");
}
function transactionHTML(x){
 return `<div class="row"><div class="pill">${x.type==="income"?"↓":"↑"}</div><div class="row-main"><strong>${esc(x.category)}</strong><span>${esc(x.note||"")} ${x.note?"• ":""}${fmtDate(x.date)}</span></div><strong class="amount ${x.type==="income"?"income":"expense"}">${x.type==="income"?"+":"−"}${money(x.amount)}</strong><button class="danger" data-delete="transaction" data-id="${x.id}">×</button></div>`;
}
function renderTransactions(){
 $("transactionList").innerHTML=data.transactions.length?data.transactions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(transactionHTML).join(""):empty("Add your first transaction");
}
function renderBudgets(){
 $("budgetList").innerHTML=data.budgets.length?data.budgets.map(b=>{
  const spent=data.transactions.filter(t=>t.type==="expense"&&t.category===b.name).reduce((a,t)=>a+Number(t.amount),0);
  const pct=Math.min(spent/Math.max(Number(b.limit),1),1)*100;
  return `<div class="budget-card"><div class="budget-meta"><strong>${esc(b.name)}</strong><span>${money(spent)} / ${money(b.limit)}</span></div><div class="progress"><i style="width:${pct}%"></i></div><div class="budget-meta"><span>${Math.round(pct)}% used</span><button class="danger" data-delete="budget" data-id="${b.id}">Delete</button></div></div>`
 }).join(""):empty("Create a category budget to start tracking");
}
function goalHTML(g){
 const pct=Math.min(Number(g.saved)/Math.max(Number(g.target),1),1)*100;
 return `<div class="row"><div class="pill">🎯</div><div class="row-main"><strong>${esc(g.name)}</strong><span>${money(g.saved)} saved of ${money(g.target)}</span><div class="progress"><i style="width:${pct}%"></i></div></div><button class="danger" data-delete="goal" data-id="${g.id}">×</button></div>`;
}
function renderGoals(){$("goalList").innerHTML=data.goals.length?data.goals.map(goalHTML).join(""):empty("Create a savings goal");}
function billHTML(b){
 return `<div class="row"><button class="icon-btn" style="width:38px;height:38px;font-size:15px" data-paid="${b.id}">${b.paid?"✓":"○"}</button><div class="row-main"><strong>${esc(b.name)}</strong><span>Due ${fmtDate(b.due)}</span></div><strong class="amount">${money(b.amount)}</strong><button class="danger" data-delete="bill" data-id="${b.id}">×</button></div>`;
}
function renderBills(){$("billList").innerHTML=data.bills.length?data.bills.slice().sort((a,b)=>new Date(a.due)-new Date(b.due)).map(billHTML).join(""):empty("Add your recurring bills");}

function openModal(type){
 $("modal").classList.remove("hidden");
 const titles={transaction:"Add transaction",budget:"New budget",goal:"Savings goal",bill:"New bill"};
 $("modalTitle").textContent=titles[type];
 const today=new Date().toISOString().slice(0,10);
 let html="";
 if(type==="transaction") html=`<div class="field"><label>Type</label><select name="type"><option value="expense">Expense</option><option value="income">Income</option></select></div><div class="field"><label>Amount</label><input name="amount" type="number" step="0.01" min="0" required placeholder="0.00"></div><div class="field"><label>Category</label><select name="category">${["Food","Gas","Bills","Shopping","Fun","Rent","Savings","Other"].map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>Note</label><input name="note" maxlength="80" placeholder="Optional"></div><div class="field"><label>Date</label><input name="date" type="date" value="${today}" required></div>`;
 if(type==="budget") html=`<div class="field"><label>Category</label><input name="name" required placeholder="Food"></div><div class="field"><label>Monthly limit</label><input name="limit" type="number" step="0.01" min="0" required placeholder="500"></div>`;
 if(type==="goal") html=`<div class="field"><label>Goal name</label><input name="name" required placeholder="Emergency fund"></div><div class="field"><label>Target amount</label><input name="target" type="number" step="0.01" min="0" required placeholder="5000"></div><div class="field"><label>Already saved</label><input name="saved" type="number" step="0.01" min="0" value="0"></div>`;
 if(type==="bill") html=`<div class="field"><label>Bill name</label><input name="name" required placeholder="Car insurance"></div><div class="field"><label>Amount</label><input name="amount" type="number" step="0.01" min="0" required placeholder="150"></div><div class="field"><label>Due date</label><input name="due" type="date" value="${today}" required></div>`;
 $("form").innerHTML=html+`<div class="form-actions"><button type="button" class="cancel" id="cancelForm">Cancel</button><button class="save">Save</button></div>`;
 $("form").dataset.type=type;
 $("cancelForm").onclick=closeModal;
}
function closeModal(){$("modal").classList.add("hidden");$("form").innerHTML=""}
$("closeModal").onclick=closeModal;
$("form").addEventListener("submit",e=>{
 e.preventDefault();const type=e.currentTarget.dataset.type;const f=new FormData(e.currentTarget);const v=Object.fromEntries(f.entries());
 if(type==="transaction")data.transactions.push({id:id(),type:v.type,amount:Number(v.amount),category:v.category,note:v.note,date:v.date});
 if(type==="budget")data.budgets.push({id:id(),name:v.name,limit:Number(v.limit)});
 if(type==="goal")data.goals.push({id:id(),name:v.name,target:Number(v.target),saved:Number(v.saved||0)});
 if(type==="bill")data.bills.push({id:id(),name:v.name,amount:Number(v.amount),due:v.due,paid:false});
 closeModal();save();
});

document.addEventListener("click",e=>{
 const tab=e.target.closest("[data-tab]");if(tab){document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));tab.classList.add("active");document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));$(tab.dataset.tab).classList.add("active");window.scrollTo({top:0,behavior:"smooth"})}
 const target=e.target.closest("[data-tab-target]");if(target){document.querySelector(`[data-tab="${target.dataset.tabTarget}"]`).click()}
 const open=e.target.closest("[data-open]");if(open)openModal(open.dataset.open);
 const del=e.target.closest("[data-delete]");if(del){const k=del.dataset.delete;data[k+"s"]=data[k+"s"].filter(x=>x.id!==del.dataset.id);save()}
 const paid=e.target.closest("[data-paid]");if(paid){const b=data.bills.find(x=>x.id===paid.dataset.paid);if(b){b.paid=!b.paid;save()}}
});

render();
