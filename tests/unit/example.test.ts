// Example unit test
describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify environment is ready', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })
})
