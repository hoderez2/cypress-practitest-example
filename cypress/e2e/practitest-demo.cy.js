describe('PractiTest Demo', () => {

  it('Homepage loads', () => {
    cy.visit('https://example.com')
    cy.contains('Example Domain')
  })

  it('Intentional failure', () => {
    cy.visit('https://example.com')
    cy.contains('Something that does not exist')
  })

})