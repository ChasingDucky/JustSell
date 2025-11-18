import React, { useState } from 'react';
import { Form, Input, Button, Space, message } from 'antd';
import RatingStars from './RatingStars';
import api from '../../services/api';

const { TextArea } = Input;

interface ReviewFormProps {
  cardId: string;
  orderId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ cardId, orderId, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await api.createReview({
        cardId,
        orderId,
        rating,
        title: values.title,
        comment: values.comment,
      });
      message.success('Review submitted successfully!');
      form.resetFields();
      setRating(5);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item label="Rating" required>
        <RatingStars value={rating} onChange={setRating} allowHalf={false} />
      </Form.Item>

      <Form.Item
        name="title"
        label="Review Title"
        rules={[
          { required: true, message: 'Please enter a title' },
          { max: 200, message: 'Title must be less than 200 characters' },
        ]}
      >
        <Input placeholder="Summarize your experience" maxLength={200} />
      </Form.Item>

      <Form.Item
        name="comment"
        label="Your Review"
        rules={[
          { required: true, message: 'Please enter your review' },
          { max: 2000, message: 'Review must be less than 2000 characters' },
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Tell us about your experience with this card"
          maxLength={2000}
          showCount
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Review
          </Button>
          {onCancel && (
            <Button onClick={onCancel}>
              Cancel
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ReviewForm;
