import {
  navigateBackSafely,
  navigateToRegisteredRoute,
  returnToModuleHome,
} from '../returnToModuleHome';

const navigator = (
  routeNames: string[],
  routeNamesInState = routeNames,
  routes = routeNames.map((name) => ({ name })),
  index = routes.length - 1,
  parent?: ReturnType<typeof navigator>,
) => ({
  canGoBack: jest.fn(() => index > 0),
  getState: jest.fn(() => ({ routeNames: routeNamesInState, routes, index })),
  getParent: jest.fn(() => parent),
  goBack: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn(),
});

describe('module home navigation', () => {
  it('resets to the closest module home route', () => {
    const nav = navigator(['Home', 'OrderStepUI', 'OrderConfirm']);

    expect(returnToModuleHome(nav)).toBe(true);
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });

  it('uses the app Home route before the generic dashboard', () => {
    const nav = navigator(['Dashboard', 'Home', 'OrderConfirmedScreen']);

    expect(returnToModuleHome(nav)).toBe(true);
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });

  it('finds the module home in a parent navigator', () => {
    const parent = navigator(['PaymentsModule', 'Home']);
    const nav = navigator(['OrderSuccessful'], ['OrderSuccessful'], undefined, 0, parent);

    expect(returnToModuleHome(nav)).toBe(true);
    expect(parent.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });

  it('supports module home routes without a nested Home screen', () => {
    const nav = navigator(['DineOutModule', 'PaymentScreen']);

    expect(returnToModuleHome(nav)).toBe(true);
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'DineOutModule' }] });
  });

  it('returns false when no supported home route is registered', () => {
    const nav = navigator(['Receipt'], ['Receipt']);

    expect(returnToModuleHome(nav)).toBe(false);
    expect(nav.reset).not.toHaveBeenCalled();
  });

  it('navigates to HelpForm in the nearest parent that registers the route', () => {
    const parent = navigator(['Home', 'HelpForm']);
    const nav = navigator(['OrderConfirmedScreen'], ['OrderConfirmedScreen'], undefined, 0, parent);

    expect(navigateToRegisteredRoute(nav, 'HelpForm', { context: 'ecommerce' })).toBe(true);
    expect(parent.navigate).toHaveBeenCalledWith('HelpForm', { context: 'ecommerce' });
  });

  it('returns false when the route is not registered in the navigation tree', () => {
    const nav = navigator(['OrderConfirmedScreen'], ['OrderConfirmedScreen']);

    expect(navigateToRegisteredRoute(nav, 'HelpForm')).toBe(false);
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

describe('safe order back navigation', () => {
  it('returns to the previous order list when it is safe', () => {
    const nav = navigator(
      ['Home', 'MyOrder', 'OrderConfirmedScreen'],
      undefined,
      [{ name: 'Home' }, { name: 'MyOrder' }, { name: 'OrderConfirmedScreen' }],
    );

    expect(navigateBackSafely(nav, { fallbackRouteNames: ['MyOrder', 'Home'] })).toBe(true);
    expect(nav.goBack).toHaveBeenCalledTimes(1);
    expect(nav.reset).not.toHaveBeenCalled();
  });

  it('does not return to checkout after order confirmation', () => {
    const nav = navigator(
      ['Home', 'OrderStepUI', 'MyOrder', 'OrderConfirm'],
      undefined,
      [{ name: 'Home' }, { name: 'OrderStepUI' }, { name: 'OrderConfirm' }],
      2,
    );

    expect(
      navigateBackSafely(nav, {
        fallbackRouteNames: ['MyOrder', 'Home'],
        blockedPreviousRouteNames: ['OrderStepUI'],
      }),
    ).toBe(true);
    expect(nav.goBack).not.toHaveBeenCalled();
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MyOrder' }] });
  });

  it('falls back to the module home when no history is available', () => {
    const nav = navigator(['Home', 'ServiceOrderDetail'], undefined, [{ name: 'ServiceOrderDetail' }], 0);

    expect(navigateBackSafely(nav, { fallbackRouteNames: ['MyOrder', 'Home'] })).toBe(true);
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });

  it('does not reset to the current order list when Back has no history', () => {
    const nav = navigator(['MyOrder', 'Home'], undefined, [{ name: 'MyOrder' }], 0);

    expect(navigateBackSafely(nav, { fallbackRouteNames: ['MyOrder', 'Home'] })).toBe(true);
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });
});
