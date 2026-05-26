import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../src/ui/pageUI.js', () => ({
  displayFact: vi.fn(),
  showLoading: vi.fn(),
  showError: vi.fn(),
  onNewFactRequested: vi.fn(),
}));

vi.mock('../../../src/controller/factController.js', () => ({
  setCallbacks: vi.fn(),
  initialize: vi.fn(),
  requestRandomFact: vi.fn(),
  changeLanguage: vi.fn(),
}));

import { displayFact, showLoading, showError, onNewFactRequested } from '../../../src/ui/pageUI.js';
import { setCallbacks, initialize, requestRandomFact } from '../../../src/controller/factController.js';

describe('main.js page initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadMain() {
    // Reset module registry so main.js re-executes on each import
    vi.resetModules();

    // Re-mock after resetModules
    vi.doMock('../../../src/ui/pageUI.js', () => ({
      displayFact: vi.fn(),
      showLoading: vi.fn(),
      showError: vi.fn(),
      onNewFactRequested: vi.fn(),
    }));

    vi.doMock('../../../src/controller/factController.js', () => ({
      setCallbacks: vi.fn(),
      initialize: vi.fn(),
      requestRandomFact: vi.fn(),
      changeLanguage: vi.fn(),
    }));

    const mainModule = await import('../../../src/ui/main.js');
    const pageUI = await import('../../../src/ui/pageUI.js');
    const controller = await import('../../../src/controller/factController.js');

    return { mainModule, pageUI, controller };
  }

  it('calls setCallbacks with onFact, onLoading, and onError', async () => {
    const { controller } = await loadMain();

    expect(controller.setCallbacks).toHaveBeenCalledTimes(1);
    const callbacks = controller.setCallbacks.mock.calls[0][0];
    expect(callbacks).toHaveProperty('onFact');
    expect(callbacks).toHaveProperty('onLoading');
    expect(callbacks).toHaveProperty('onError');
  });

  it('wires onNewFactRequested to call requestRandomFact', async () => {
    const { pageUI, controller } = await loadMain();

    expect(pageUI.onNewFactRequested).toHaveBeenCalledTimes(1);
    const buttonCallback = pageUI.onNewFactRequested.mock.calls[0][0];

    buttonCallback();
    expect(controller.requestRandomFact).toHaveBeenCalledTimes(1);
  });

  it('calls showLoading immediately', async () => {
    const { pageUI } = await loadMain();

    expect(pageUI.showLoading).toHaveBeenCalledTimes(1);
  });

  it('calls initialize to fetch the first fact', async () => {
    const { controller } = await loadMain();

    expect(controller.initialize).toHaveBeenCalledTimes(1);
  });

  it('onLoading callback only calls showLoading when isLoading is true', async () => {
    const { pageUI, controller } = await loadMain();

    const callbacks = controller.setCallbacks.mock.calls[0][0];

    // Reset showLoading call count (it was called during init)
    pageUI.showLoading.mockClear();

    callbacks.onLoading(true);
    expect(pageUI.showLoading).toHaveBeenCalledTimes(1);

    pageUI.showLoading.mockClear();
    callbacks.onLoading(false);
    expect(pageUI.showLoading).not.toHaveBeenCalled();
  });

  it('onFact callback calls displayFact with the factResponse', async () => {
    const { pageUI, controller } = await loadMain();

    const callbacks = controller.setCallbacks.mock.calls[0][0];
    const factResponse = { fact: { text: 'Test fact' }, isFromFallback: false };

    callbacks.onFact(factResponse);
    expect(pageUI.displayFact).toHaveBeenCalledWith(factResponse);
  });

  it('onError callback calls showError with the message', async () => {
    const { pageUI, controller } = await loadMain();

    const callbacks = controller.setCallbacks.mock.calls[0][0];

    callbacks.onError('Something went wrong');
    expect(pageUI.showError).toHaveBeenCalledWith('Something went wrong');
  });
});
