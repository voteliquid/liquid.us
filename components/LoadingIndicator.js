const Component = require('./Component')

module.exports = class LoadingIndicator extends Component {
  render() {
    return this.html`
      <div class="loader"></div>
      <style>
        .loader,
        .loader:after {
          border-radius: 50%;
          width: 3rem;
          height: 3rem;
        }
        .loader {
          display: block;
          overflow: auto;
          position: relative;
          margin: 5rem auto 1rem;
          font-size: 10px;
          position: relative;
          text-indent: -9999em;
          border-top: 0.3rem solid rgba(204,204,204, 0.2);
          border-right: 0.3rem solid rgba(204,204,204, 0.2);
          border-bottom: 0.3rem solid rgba(204,204,204, 0.2);
          border-left: 0.3rem solid #cccccc;
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
      </style>
    `
  }
}
