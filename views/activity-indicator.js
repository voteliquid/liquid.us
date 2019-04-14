const { html } = require('../helpers')

const sizes = {
  small: '1.5em',
  medium: '3em',
  large: '5em',
}

module.exports = (params = {}) => {
  const size = sizes[params.size || 'medium']
  return html`
    <div class="loader">
      <style>${`
        .loader,
        .loader:after {
          border-radius: 50%;
          width: ${size};
          height: ${size};
        }
        .loader {
          display: block;
          overflow: auto;
          position: relative;
          margin: ${params.margin || 0} auto;
          font-size: 10px;
          position: relative;
          text-indent: -9999em;
          border-top: 0.4em solid rgba(204,204,204, 0.2);
          border-right: 0.4em solid rgba(204,204,204, 0.2);
          border-bottom: 0.4em solid rgba(204,204,204, 0.2);
          border-left: 0.4em solid #cccccc;
          -webkit-transform: translateZ(0);
          -ms-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-animation: load8 1.1s infinite linear;
          animation: load8 1.1s infinite linear;
        }
        @-webkit-keyframes load8 {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }
        @keyframes load8 {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  `
}
