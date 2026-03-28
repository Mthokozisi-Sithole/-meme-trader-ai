COMMAND: analyze-market

Use:
- Data Engineer + Quant Analyst

Do:
- Fetch top N meme coins (DexScreener-like schema)
- Compute sentiment proxies + momentum
- Rank and output top opportunities

Output schema:
[
  { coin, narrative, sentiment, technical, liquidity, momentum, score }
]
