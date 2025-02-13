import * as lib from '../../src/shortcode-tokenizer'
const Tokenizer = lib.default
const Token = lib.Token

describe('ShortcodeTokenizer', () => {
  describe('RegExps', () => {
    it('should match enclosure tag', function () {
      expect('[code]').to.match(Tokenizer.rxEnclosure)
      expect('[/code]').to.match(Tokenizer.rxEnclosure)
      expect('[code/]').to.match(Tokenizer.rxEnclosure)
      expect('[code /]').to.match(Tokenizer.rxEnclosure)

      // Not many negativ tests since this is just used
      // as an indicator that a code is precent or not
      expect('[ ]').not.to.match(Tokenizer.rxEnclosure)
    })

    it('should match close tag', function () {
      expect('[/code]').to.match(Tokenizer.rxClose)

      expect('[/ code]').not.to.match(Tokenizer.rxClose)
      expect('[/ code ]').not.to.match(Tokenizer.rxClose)
      expect('[ /code]').not.to.match(Tokenizer.rxClose)
      expect('[ / code ]').not.to.match(Tokenizer.rxClose)
    })

    it('should match open tag', function () {
      expect('[code]').to.match(Tokenizer.rxOpen)
      expect('[code a]').to.match(Tokenizer.rxOpen)
      expect('[code a=1]').to.match(Tokenizer.rxOpen)
      expect('[code a=1.1]').to.match(Tokenizer.rxOpen)
      expect('[code a="a"]').to.match(Tokenizer.rxOpen)
      expect('[code a=\'a\']').to.match(Tokenizer.rxOpen)

      expect('[code ]').not.to.match(Tokenizer.rxOpen)
      expect('[code a ]').not.to.match(Tokenizer.rxOpen)
      expect('[code a=1 ]').not.to.match(Tokenizer.rxOpen)
      expect('[code a=1.]').not.to.match(Tokenizer.rxOpen)
    })

    it('should match self-closing tag', function () {
      expect('[code/]').to.match(Tokenizer.rxSelfclosing)
      expect('[code /]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a/]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a /]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a=1/]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a=1 /]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a=1.1/]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a=1.1 /]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a="a"/]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a="a" /]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a=\'a\'/]').to.match(Tokenizer.rxSelfclosing)
      expect('[code a=\'a\' /]').to.match(Tokenizer.rxSelfclosing)

      expect('[code  /]').not.to.match(Tokenizer.rxSelfclosing)
      expect('[code/ ]').not.to.match(Tokenizer.rxSelfclosing)
      expect('[code / ]').not.to.match(Tokenizer.rxSelfclosing)
      expect('[code a  /]').not.to.match(Tokenizer.rxSelfclosing)
      expect('[code a  / ]').not.to.match(Tokenizer.rxSelfclosing)
      expect('[code a=1./]').not.to.match(Tokenizer.rxSelfclosing)
      expect('[code a=1. /]').not.to.match(Tokenizer.rxSelfclosing)
    })
  })

  describe('Token creation', () => {
    let tokenizer

    let constructorWrapper = function () {
      let args = arguments
      return function () {
        return new Token(...args)
      }
    }

    beforeEach(() => {
      tokenizer = new Tokenizer()
      spy(tokenizer, 'getTokens')
    })

    it('should create a simple OPEN token', () => {
      let input = '[basket]'
      let basketToken = new Token(Tokenizer.OPEN, input)
      expect(tokenizer.getTokens(input)).to.eql([basketToken])
    })

    it('should throw syntax error on invalid input, OPEN', () => {
      // only testing one case since rx is already tested above
      let input = '[row'
      expect(constructorWrapper(Tokenizer.OPEN, input))
        .to.throw('Invalid OPEN token: ' + input)
    })

    it('should throw syntax error on invalid input, SELF_CLOSING', () => {
      // only testing one case since rx is already tested above
      let input = '[row'
      expect(constructorWrapper(Tokenizer.SELF_CLOSING, input))
        .to.throw('Invalid SELF_CLOSING token: ' + input)
    })

    it('should throw syntax error on invalid input, CLOSE', () => {
      // only testing one case since rx is already tested above
      let input = '[row'
      expect(constructorWrapper(Tokenizer.CLOSE, input))
        .to.throw('Invalid CLOSE token: ' + input)
    })

    it('should create an OPEN token with three params', () => {
      let input = '[basket total=32 tax=3.2 checkout-button="Checkout"]'
      const result = tokenizer.getTokens(input)
      expect(result[0].name).to.eql('basket')
      expect(result[0].params).to.eql({
        total: 32,
        tax: 3.2,
        'checkout-button': 'Checkout'
      })
    })
  })

  describe('Tokenize function', () => {
    let tokenizer

    beforeEach(() => {
      tokenizer = new Tokenizer()
      spy(tokenizer, 'getTokens')
    })

    it('should throw an error when not passing a string', () => {
      expect(tokenizer.getTokens.bind(tokenizer)).to.throw('Invalid input')
      expect(tokenizer.getTokens.bind(tokenizer, {})).to.throw('Invalid input')
      expect(tokenizer.getTokens.bind(tokenizer, 1)).to.throw('Invalid input')
      expect(tokenizer.getTokens).to.have.been.callCount(3)
    })

    it('should return a single element array when passed a string with no matches', () => {
      expect(tokenizer.input('').getTokens()).to.be.an.instanceof(Array)
      expect(tokenizer.input('').getTokens()).to.be.empty
      expect(tokenizer.input(' ').getTokens()).to.eql([new Token(Tokenizer.TEXT, ' ')])
    })

    it('should reset internal position when re-running', () => {
      expect(tokenizer.input('').getTokens()).to.be.an.instanceof(Array)
      expect(tokenizer.input('').getTokens()).to.be.empty
      expect(tokenizer.input(' ').getTokens()).to.eql([new Token(Tokenizer.TEXT, ' ')])
      expect(tokenizer.input(' ').getTokens()).to.eql([new Token(Tokenizer.TEXT, ' ', 0)])
    })

    it('should return a single element array when passed a string with no matches, more cases', () => {
      expect(tokenizer.input('Hello').getTokens()).to.eql([new Token(Tokenizer.TEXT, 'Hello')])
      expect(tokenizer.input('[Hello').getTokens()).to.eql([new Token(Tokenizer.TEXT, '[Hello')])
      expect(tokenizer.input(']Hello').getTokens()).to.eql([new Token(Tokenizer.TEXT, ']Hello')])
      expect(tokenizer.input(']Hello[').getTokens()).to.eql([new Token(Tokenizer.TEXT, ']Hello[')])
      expect(tokenizer.input('][Hello').getTokens()).to.eql([new Token(Tokenizer.TEXT, '][Hello')])
      expect(tokenizer.input('[]Hello').getTokens()).to.eql([new Token(Tokenizer.TEXT, '[]Hello')])
      expect(tokenizer.input('Hello[]').getTokens()).to.eql([new Token(Tokenizer.TEXT, 'Hello[]')])
      expect(tokenizer.input('Hello[ ]').getTokens()).to.eql([new Token(Tokenizer.TEXT, 'Hello[ ]')])
      expect(tokenizer.input('Hel[ ]lo').getTokens()).to.eql([new Token(Tokenizer.TEXT, 'Hel[ ]lo')])
    })

    it('should parse a flag-type param', () => {
      let input = '[basket keep-alive]'
      let basketToken = new Token(Tokenizer.OPEN, input)
      expect(tokenizer.input(input).getTokens()).to.eql([basketToken])
    })
  })

  describe('AST function', () => {
    let tokenizer

    beforeEach(() => {
      tokenizer = new Tokenizer()
    })

    it('should return empty array on empty input', () => {
      expect(tokenizer.input('').ast()).to.be.empty
    })

    it('should return an AST with only one text node', () => {
      expect(tokenizer.input('Hello').ast()).to.eql([new Token('TEXT', 'Hello')])
    })

    it('should throw exception if dangling CLOSE is encountered', () => {
      expect(tokenizer.input('[/code]').ast.bind(tokenizer)).to.throw('Unmatched close token: [/code]')
      expect(tokenizer.input('[foo][/bar]').ast.bind(tokenizer)).to.throw('Unmatched close token: [/bar]')
    })

    it('should convert dangling CLOSE if not strict', () => {
      tokenizer.strict = false
      expect(tokenizer.input('[/code]').ast()).to.eql([new Token('ERROR', '[/code]')])
    })

    it('should throw exception if orfant OPEN', () => {
      expect(tokenizer.input('[code]').ast.bind(tokenizer)).to.throw('Unmatched open token: [code]')
    })

    it('should return a single non-text node AST', () => {
      const match = new Token(Tokenizer.OPEN, '[code]', 0)
      match.isClosed = true

      const ast = tokenizer.input('[code][/code]').ast()
      expect(ast).to.eql(ast)
      expect(ast.children).to.be.empty
    })

    it('should return a single non-text node AST (self-closing)', () => {
      const match = new Token(Tokenizer.SELF_CLOSING, '[code/]', 0)
      match.isClosed = true

      const ast = tokenizer.input('[code/]').ast()
      expect(ast).to.eql(ast)
      expect(ast.children).to.be.empty
    })

    it('should return a single non-text node AST with a text child', () => {
      const openNode = new Token(Tokenizer.OPEN, '[code]', 0)
      openNode.isClosed = true
      openNode.children.push(new Token(Tokenizer.TEXT, 'dance dance', 6))

      const ast = tokenizer.input('[code]dance dance[/code]').ast()
      expect(ast).to.be.an.instanceof(Array)
      expect(ast).to.eql([openNode])
    })

    it('should return a single non-text node AST with a self-closing child', () => {
      const openNode = new Token(Tokenizer.OPEN, '[code]', 0)
      openNode.isClosed = true
      openNode.children.push(new Token(Tokenizer.SELF_CLOSING, '[foo/]', 6))

      const ast = tokenizer.input('[code][foo/][/code]').ast()
      expect(ast).to.be.an.instanceof(Array)
      expect(ast).to.eql([openNode])
    })

    it('should return a single non-text node AST with a text child (multiline)', () => {
      const dance = `
        dance dance
        `
      const openNode = new Token(Tokenizer.OPEN, '[code]', 0)
      openNode.isClosed = true
      openNode.children.push(new Token(Tokenizer.TEXT, dance, 6))

      const ast = tokenizer.input(`[code]${dance}[/code]`).ast()
      expect(ast).to.be.an.instanceof(Array)
      expect(ast).to.eql([openNode])
    })

    it('should return a non-text node AST with a text child + a single text node', () => {
      const openNode = new Token(Tokenizer.OPEN, '[code]', 0)
      openNode.isClosed = true
      openNode.children.push(new Token(Tokenizer.TEXT, 'dance dance', 6))
      const astMatch = [
        openNode,
        new Token(Tokenizer.TEXT, 'now', 24)
      ]

      const ast = tokenizer.input('[code]dance dance[/code]now').ast()
      expect(ast).to.be.an.instanceof(Array)
      expect(ast).to.eql(astMatch)
    })

    it('should return a nested AST', () => {
      const openNode = new Token(Tokenizer.OPEN, '[code]', 0)
      openNode.isClosed = true
      const openNode2 = new Token(Tokenizer.OPEN, '[code]', 6)
      openNode2.isClosed = true
      openNode.children.push(openNode2)
      const astMatch = [openNode]

      const ast = tokenizer.input('[code][code][/code][/code]').ast()
      expect(ast).to.be.an.instanceof(Array)
      expect(ast).to.eql(astMatch)
    })

    it('should return multiple root nodes and children', () => {
      const row1 = new Token(Tokenizer.OPEN, '[row]', 0)
      row1.isClosed = true
      const col1 = new Token(Tokenizer.OPEN, '[col]', 5)
      col1.isClosed = true
      col1.children.push(new Token(Tokenizer.TEXT, 'Hello', 10))
      row1.children.push(col1)
      const col2 = new Token(Tokenizer.OPEN, '[col]', 21)
      col2.isClosed = true
      col2.children.push(new Token(Tokenizer.TEXT, 'World', 26))
      row1.children.push(col2)

      const row2 = new Token(Tokenizer.OPEN, '[row]', 43)
      row2.isClosed = true
      const col3 = new Token(Tokenizer.OPEN, '[col]', 48)
      col3.isClosed = true
      col3.children.push(new Token(Tokenizer.TEXT, 'Foo', 53))
      row2.children.push(col3)
      const col4 = new Token(Tokenizer.OPEN, '[col]', 62)
      col4.isClosed = true
      col4.children.push(new Token(Tokenizer.TEXT, 'Bar', 67))
      row2.children.push(col4)

      const astMatch = [row1, row2]

      const ast = tokenizer.input('[row][col]Hello[/col][col]World[/col][/row][row][col]Foo[/col][col]Bar[/col][/row]').ast()
      expect(ast).to.be.an.instanceof(Array)
      expect(ast).to.eql(astMatch)
    })

    it('should throw error on nested dangling close', () => {
      const astMethod = tokenizer.input('[row][col]Hello[/col][col]World[/col][/row][row][col]Foo[/col][/col]Bar[/col][/row]').ast
      expect(astMethod.bind(tokenizer)).to.throw('Unmatched close token: [/col]')
    })
  })
})
