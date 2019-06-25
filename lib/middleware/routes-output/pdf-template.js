const css = `
  <style>
  html, body, div {
    margin: 0 !important;
    padding: 0 !important;
    font-size: 10px;
  }
  .pdfFooter {
    display: block;
    border-top: solid 1px #bfc1c3;
    margin: 0 0.5cm;
    padding: 0.125cm 0;
    -webkit-print-color-adjust: exact;
    width: 100%;
    box-sizing: border-content;
  }
  .pdfFooter * {
    display: inline-block;
    font-family: HelveticaNeue, Helvetica, Arial, sans-serif;
  }
  .submission {
    float: left;
  }
  .pages {
    float: right;
  }
  </style>
`

function pdfTemplate (submission) {
  return `
${css}
<span class="pdfFooter">
<span class="submission">${submission}</span>
<span class="pages"><span class="pageNumber">pageNumber</span>/<span class="totalPages">totalPages</span></span>
</span>
  `
}

module.exports = pdfTemplate
