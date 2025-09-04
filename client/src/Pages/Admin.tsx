import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

interface Chapter {
  id: number;
  subject: string;
  phase: number;
  name: string;
  serial_number: number;
}

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChapter, setNewChapter] = useState({
    subject: 'phy',
    phase: 1,
    name: '',
    serial_number: 1
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await API.get('me/');
        setUser(userResponse.data);

        if (!userResponse.data.is_staff) {
          navigate('/dashboard');
          return;
        }

        const chaptersResponse = await API.get('chapters/');
        setChapters(chaptersResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/');
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await API.post('chapters/', newChapter);
      setChapters([...chapters, response.data]);
      setNewChapter({
        subject: 'phy',
        phase: 1,
        name: '',
        serial_number: chapters.length > 0 ? Math.max(...chapters.map(c => c.serial_number)) + 1 : 1
      });
    } catch (err) {
      console.error('Error adding chapter:', err);
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    try {
      await API.delete(`chapters/${chapterId}/`);
      setChapters(chapters.filter(chapter => chapter.id !== chapterId));
    } catch (err) {
      console.error('Error deleting chapter:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewChapter({
      ...newChapter,
      [name]: name === 'phase' || name === 'serial_number' ? parseInt(value) : value
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <style>{`
        * {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        *::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

.admin-page {
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family: monospace;
}

.admin-page input,
.admin-page select,
.admin-page button {
  font-family: monospace;
}

.admin-content {
  width: 100%;
  max-width: 1200px;
}

.chapter-management {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.add-chapter-form,
.chapters-list {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

@media (min-width: 1024px) {
  .admin-page {
    padding: 2rem;
  }

  .chapter-management {
    flex-direction: row;
    gap: 2rem;
  }

  .add-chapter-form {
    flex: 0 0 350px;
    position: sticky;
    top: 2rem;
    height: fit-content;
    padding: 2rem;
  }

  .chapters-list {
    flex: 1;
    padding: 2rem;
  }
}

.add-chapter-form h3 {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.form-group input,
.form-group select {
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #da4187;
  box-shadow: 0 0 0 2px rgba(218, 65, 135, 0.1);
}

.add-chapter-form button {
  margin-top: 1rem;
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  background: #da4187;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  height: 45px;
}

.add-chapter-form button:hover {
  background: #ef90b9ff;
  transform: translateY(-1px);
}

.add-chapter-form button:active {
  transform: translateY(0);
}

.chapters-list {
  overflow-x: auto;
}

.chapters-list h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
  position: sticky;
  left: 0;
  background: #fff;
}

.chapters-list table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.chapters-list th,
.chapters-list td {
  text-align: left;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.chapters-list th {
  font-weight: 600;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
}

@media (max-width: 768px) {
  .chapters-list table {
    min-width: unset;
  }
  
  .chapters-list thead {
    display: none;
  }
  
  .chapters-list tr {
    display: grid;
    grid-template-columns: repeat(2, auto);
    gap: 0.5rem;
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }
  
  .chapters-list td {
    padding: 0;
    border: none;
    white-space: nowrap;
  }
  
  .chapters-list td:nth-child(3),
  .chapters-list td:nth-child(4),
  .chapters-list td:nth-child(5) {
    grid-column: 1 / -1;
    white-space: normal;
    padding-top: 0.5rem;
  }
  
  .chapters-list td:nth-child(4) {
    padding-top: 0.75rem;
  }
  
  .chapters-list td:nth-child(4) {
    font-weight: 500;
  }

  .chapters-list td::before {
    content: attr(data-label);
    font-weight: 600;
    margin-right: 0.5rem;
    color: #666;
  }
  
  .chapters-list td:nth-child(4)::before,
  .chapters-list td:nth-child(5)::before {
    display: block;
    margin-bottom: 0.25rem;
  }
}

.delete-button {
  background: #da4187;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.delete-button:hover {
  background: #ef90b9ff;
  transform: translateY(-1px);
}

.delete-button:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .add-chapter-form,
  .chapters-list {
    padding: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group input,
  .form-group select {
    padding: 0.7rem;
    font-size: 16px;
  }

  .chapters-list {
    border-radius: 12px;
    overflow: hidden;
  }

  .chapters-list table {
    min-width: unset;
  }

  .chapters-list th,
  .chapters-list td {
    padding: 0.8rem;
  }

  .delete-button {
    padding: 0.4rem 0.8rem;
  }
}

    `}</style>
      <div className="admin-page">
        <main className="admin-content">
          <div className="chapter-management">

            <form onSubmit={handleAddChapter} className="add-chapter-form">
              <h3>Add New Chapter</h3>
              <div className="form-group">
                <label>Subject:</label>
                <select
                  name="subject"
                  value={newChapter.subject}
                  onChange={handleInputChange}
                >
                  <option value="phy">Physics</option>
                  <option value="chem">Chemistry</option>
                  <option value="math">Math</option>
                </select>
              </div>

              <div className="form-group">
                <label>Phase:</label>
                <input
                  type="number"
                  name="phase"
                  value={newChapter.phase}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Chapter Name:</label>
                <input
                  type="text"
                  name="name"
                  value={newChapter.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>S.No:</label>
                <input
                  type="number"
                  name="serial_number"
                  value={newChapter.serial_number}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>

              <button type="submit">Add Chapter</button>
            </form>

            <div className="chapters-list">
              <h3>Existing Chapters</h3>
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Phase</th>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map(chapter => (
                    <tr key={chapter.id}>
                      <td data-label="Subject">{chapter.subject.toUpperCase()}</td>
                      <td data-label="Phase">{chapter.phase}</td>
                      <td data-label="S.No">{chapter.serial_number}</td>
                      <td data-label="Chapter Name">{chapter.name}</td>
                      <td data-label="Actions">
                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>

  );
};

export default Admin;