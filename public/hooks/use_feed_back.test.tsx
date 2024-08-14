/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useFeedback } from './use_feed_back';
import * as chatStateHookExports from './use_chat_state';
import { Interaction, IOutput, IMessage } from '../../common/types/chat_saved_object_attributes';
import { DataSourceService } from '../services';
import { HttpSetup } from '../../../../src/core/public';
import { ASSISTANT_API } from '../../common/constants/llm';

jest.mock('../services');

describe('useFeedback hook', () => {
  const httpMock: jest.Mocked<HttpSetup> = ({
    put: jest.fn(),
  } as unknown) as jest.Mocked<HttpSetup>;

  const dataSourceServiceMock = ({
    getDataSourceQuery: jest.fn(),
  } as unknown) as DataSourceService;
  const chatStateDispatchMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: [], interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set state if passed with initial feedback state', () => {
    const mockInteraction = {
      additional_info: { feedback: { satisfaction: true } },
    } as Interaction;
    const { result } = renderHook(() => useFeedback(mockInteraction));
    expect(result.current.feedbackResult).toBe(true);
  });

  it('should have an undefined state if not passed with initial feedback state', () => {
    const { result } = renderHook(() => useFeedback());
    expect(result.current.feedbackResult).toBe(undefined);
  });

  it('should call feedback api regularly with passed correct value and set feedback state if call API success', async () => {
    const mockInteraction = {
      interaction_id: 'interactionId',
    } as Interaction;
    const mockInputMessage = {
      type: 'input',
    } as IMessage;
    const mockOutputMessage = {
      type: 'output',
      interactionId: 'interactionId',
    } as IOutput;
    const mockMessages = [mockInputMessage, mockOutputMessage];
    const correct = true;
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: mockMessages, interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });
    const { result } = renderHook(() =>
      useFeedback(mockInteraction, httpMock, dataSourceServiceMock)
    );
    expect(result.current.feedbackResult).toBe(undefined);

    const sendFeedback = result.current.sendFeedback;
    await act(async () => {
      await sendFeedback(mockOutputMessage, correct);
    });
    expect(httpMock.put).toHaveBeenCalledWith(
      `${ASSISTANT_API.FEEDBACK}/${mockOutputMessage.interactionId}`,
      {
        body: JSON.stringify({ satisfaction: correct }),
        query: dataSourceServiceMock.getDataSourceQuery(),
      }
    );
    expect(result.current.feedbackResult).toBe(correct);
  });

  it('should not update feedback state if API fail', async () => {
    const mockInteraction = {
      interaction_id: 'interactionId',
    } as Interaction;
    const mockInputMessage = {
      type: 'input',
    } as IMessage;
    const mockOutputMessage = {
      type: 'output',
      interactionId: 'interactionId',
    } as IOutput;
    const mockMessages = [mockInputMessage, mockOutputMessage];
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: mockMessages, interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });

    httpMock.put.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() =>
      useFeedback(mockInteraction, httpMock, dataSourceServiceMock)
    );
    expect(result.current.feedbackResult).toBe(undefined);

    const sendFeedback = result.current.sendFeedback;
    await act(async () => {
      await sendFeedback(mockOutputMessage, true);
    });

    expect(result.current.feedbackResult).toBe(undefined);
  });
});
