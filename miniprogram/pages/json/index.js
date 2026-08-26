Page({
  data: {
    value: '{\n  "hello": "world"\n}',
    error: "",
  },
  onInput(e) {
    this.setData({ value: e.detail.value });
  },
  format() {
    this.run(2);
  },
  minify() {
    this.run();
  },
  run(space) {
    try {
      const parsed = JSON.parse(this.data.value);
      this.setData({ value: JSON.stringify(parsed, null, space), error: "" });
    } catch {
      this.setData({ error: "JSON 格式不正确，请检查括号、逗号和引号。" });
    }
  },
});
