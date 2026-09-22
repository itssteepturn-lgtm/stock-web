export const CONDITION_TEMPLATES = [
  {
    group: "筹码 cost",
    items: [
      { id:"cost_cross", name:"cost金叉", desc:"cost50上穿cost75", params:[
        {key:"fast", label:"快线", type:"select", options:["cost50","cost75","cost90"], default:"cost50"},
        {key:"slow", label:"慢线", type:"select", options:["cost50","cost75","cost90"], default:"cost75"},
        {key:"days", label:"几天内", type:"number", default:3, min:1, max:10}
      ]},
      { id:"cost_position", name:"价格站上筹码", desc:"收盘价 > cost", params:[
        {key:"line", label:"筹码线", type:"select", options:["cost50","cost75","cost90"], default:"cost50"},
        {key:"op", label:"关系", type:"select", options:[">","<"], default:">"}
      ]},
      { id:"cost_concentration", name:"筹码密集", desc:"cost90-cost50 < X%", params:[
        {key:"pct", label:"密集度%", type:"number", default:5}
      ]},
      { id:"cost_divergence", name:"筹码发散", params:[
        {key:"pct", label:"发散>%", type:"number", default:8}
      ]},
    ]
  },
  {
    group: "ZQ动量",
    items: [
      { id:"zq_cross", name:"ZQ金叉", desc:"ZQ上穿ZQ1", params:[{key:"days", label:"几天内", type:"number", default:2}]},
      { id:"zq_dead", name:"ZQ死叉", params:[{key:"days", label:"几天内", type:"number", default:2}]},
      { id:"zq_up", name:"ZQ连续上升", params:[{key:"n", label:"连升天数", type:"number", default:3}]},
      { id:"zq_value", name:"ZQ数值区间", params:[{key:"min", label:"最小", type:"number", default:0},{key:"max", label:"最大", type:"number", default:100}]},
    ]
  },
  {
    group: "K线形态",
    items: [
      { id:"candle_today", name:"今日阴阳", params:[{key:"type", label:"类型", type:"select", options:["阳线","阴线","十字星"], default:"阳线"}]},
      { id:"candle_yesterday", name:"昨日阴阳", params:[{key:"type", label:"类型", type:"select", options:["阳线","阴线"], default:"阴线"}]},
      { id:"yang_yin_combo", name:"昨日阴今日阳", desc:"反转", params:[]},
      { id:"big_body", name:"大实体", params:[{key:"pct", label:"实体>%", type:"number", default:3}]},
      { id:"upper_shadow", name:"长上影", params:[{key:"ratio", label:"上影/实体>", type:"number", default:1.5}]},
      { id:"lower_shadow", name:"长下影", params:[{key:"ratio", label:"下影/实体>", type:"number", default:1.5}]},
    ]
  },
  {
    group: "量价",
    items: [
      { id:"vol_up", name:"放量", params:[{key:"times", label:"量比>", type:"number", default:1.5}]},
      { id:"vol_down", name:"缩量", params:[{key:"times", label:"量比<", type:"number", default:0.7}]},
      { id:"price_vol", name:"价量齐升", params:[]},
    ]
  },
  {
    group: "位置",
    items: [
      { id:"new_high", name:"创N日新高", params:[{key:"n", label:"N日", type:"number", default:20}]},
      { id:"new_low", name:"创N日新低", params:[{key:"n", label:"N日", type:"number", default:20}]},
      { id:"near_cost", name:"靠近筹码线", params:[{key:"line", label:"筹码线", type:"select", options:["cost50","cost75"], default:"cost50"},{key:"pct", label:"距离< %", type:"number", default:2}]},
    ]
  }
];
export function evalCondition(tplId, bars, inds, idx, params){
  const b = bars[idx]; if(!b) return false;
  switch(tplId){
    case "cost_cross":{
      for(let d=0; d<params.days; d++){
        let i=idx-d; if(i<=0) continue;
        if(inds[params.fast][i-1] <= inds[params.slow][i-1] && inds[params.fast][i] > inds[params.slow][i]) return true;
      } return false;
    }
    case "cost_position":{
      const price=b.close, line=inds[params.line][idx];
      return params.op==">"? price>line : price<line;
    }
    case "cost_concentration":{
      const c50=inds.cost50[idx], c90=inds.cost90[idx]; if(!c50) return false;
      return (c90-c50)/c50*100 < params.pct;
    }
    case "cost_divergence":{
      const c50=inds.cost50[idx], c90=inds.cost90[idx]; return (c90-c50)/c50*100 > params.pct;
    }
    case "zq_cross":{
      for(let d=0; d<params.days; d++){ let i=idx-d; if(i<=0) continue; if(inds.zq[i-1]<=inds.zq1[i-1] && inds.zq[i]>inds.zq1[i]) return true; } return false;
    }
    case "zq_dead":{
      for(let d=0; d<params.days; d++){ let i=idx-d; if(i<=0) continue; if(inds.zq[i-1]>=inds.zq1[i-1] && inds.zq[i]<inds.zq1[i]) return true; } return false;
    }
    case "zq_up":{
      for(let k=0;k<params.n-1;k++){ if(inds.zq[idx-k] <= inds.zq[idx-k-1]) return false; } return true;
    }
    case "zq_value":{ const v=inds.zq[idx]; return v>=params.min && v<=params.max; }
    case "candle_today":{
      if(params.type=="阳线") return b.close > b.open;
      if(params.type=="阴线") return b.close < b.open;
      return Math.abs(b.close-b.open)/b.open < 0.003;
    }
    case "candle_yesterday":{
      if(idx==0) return false; const y=bars[idx-1];
      return params.type=="阳线"? y.close>y.open : y.close<y.open;
    }
    case "yang_yin_combo":{
      if(idx==0) return false; return bars[idx-1].close < bars[idx-1].open && b.close > b.open;
    }
    case "big_body": return Math.abs(b.close-b.open)/b.open*100 >= params.pct;
    case "upper_shadow":{ const body=Math.abs(b.close-b.open)||0.01; const upper=b.high-Math.max(b.open,b.close); return upper/body >= params.ratio; }
    case "lower_shadow":{ const body=Math.abs(b.close-b.open)||0.01; const lower=Math.min(b.open,b.close)-b.low; return lower/body >= params.ratio; }
    case "vol_up": return idx>0 && b.vol > bars[idx-1].vol*params.times;
    case "vol_down": return idx>0 && b.vol < bars[idx-1].vol*params.times;
    case "price_vol": return idx>0 && b.close>bars[idx-1].close && b.vol>bars[idx-1].vol;
    case "new_high":{ let max=b.high; for(let k=1;k<params.n;k++){ if(idx-k<0) break; max=Math.max(max,bars[idx-k].high);} return b.high>=max; }
    case "new_low":{ let min=b.low; for(let k=1;k<params.n;k++){ if(idx-k<0) break; min=Math.min(min,bars[idx-k].low);} return b.low<=min; }
    case "near_cost":{ const line=inds[params.line][idx]; return Math.abs(b.close-line)/line*100 < params.pct; }
    default: return true;
  }
}
export function evaluateStock(bars, inds, idx, active){
  for(const cond of active){
    if(!evalCondition(cond.templateId, bars, inds, idx, cond.params)) return false;
  }
  return true;
}
