body {
  --background-color: #f2f2f2;
  --heading-background-color: #c9c9c9;
  --text-color: #4e4b4b;
  --link-color: #a40674;
}

@media (prefers-color-scheme: dark) {
  body {
    --background-color: #3a3737;
    --heading-background-color: #4e4b4b;
    --text-color: #f2f2f2;
    --link-color: #fdb1e6;
  }
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;

  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem;
}

a {
  color: var(--link-color);
  cursor: pointer;
}

.svgs {
  margin-top: 1.4rem;
  display: flex;
  justify-content: space-between;
}
.svgs div,
.svgs div canvas {
  max-width: 100%;
}

.svgs div {
  --black: #e6e6e6;
  --white: #f2f2f2;
  --block-size: 5px;

  flex: 0 1 calc(50% - 0.7rem);
  background-color: var(--white);
  background-image: linear-gradient(
      45deg,
      var(--black) 25%,
      transparent 25%,
      transparent 75%,
      var(--black) 75%,
      var(--black)
    ),
    linear-gradient(
      45deg,
      var(--black) 25%,
      transparent 25%,
      transparent 75%,
      var(--black) 75%,
      var(--black)
    );
  background-size: calc(var(--block-size) * 4) calc(var(--block-size) * 4);
  background-position: 0 0,
    calc(var(--block-size) * 2) calc(var(--block-size) * 2);
}

.svgs h2 {
  margin: 0;
  padding: 0.5rem 0;
  font-size: 1rem;
  font-weight: 400;
  text-align: center;
  color: var(--text-color);
  background-color: var(--heading-background-color);
}

form {
  margin-top: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  background-color: var(--heading-background-color);
}

form button {
  margin-left: auto;
}

form label {
  margin-right: 0.5rem;
}

footer {
  margin-top: 1rem;
}